import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { notify } from "@/lib/notify";
import { NextResponse } from "next/server";
import { z } from "zod";

const AdminEditBody = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  role: z.enum(["EMPLOYEE", "MANAGER", "ADMIN"]).optional(),
  managerId: z.string().nullable().optional(),
  departmentId: z.string().nullable().optional(),
  transferReportsTo: z.string().optional(),
});

const ManagerTransferBody = z.object({
  managerId: z.string().nullable(),
});

export async function PATCH(req: Request, ctx: { params: Promise<Record<string, string>> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const body = await req.json();

  // ── Admin: full user edit ──────────────────────────────────────────────────
  if (session.user.role === "ADMIN") {
    const parsed = AdminEditBody.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const { transferReportsTo, ...fields } = parsed.data;

    // Transfer reports only
    if (transferReportsTo) {
      await db.user.updateMany({ where: { managerId: id }, data: { managerId: transferReportsTo } });
      await logAudit("User", id, "REPORTS_TRANSFERRED", session.user.id, {}, { transferredTo: transferReportsTo });
      return NextResponse.json({ ok: true });
    }

    const target = await db.user.findUnique({
      where: { id },
      select: { managerId: true, role: true, name: true, email: true, departmentId: true, department: { select: { name: true } }, manager: { select: { name: true } } },
    });
    if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const updated = await db.user.update({
      where: { id },
      data: {
        ...(fields.name !== undefined && { name: fields.name }),
        ...(fields.email !== undefined && { email: fields.email }),
        ...(fields.role !== undefined && { role: fields.role }),
        ...(fields.managerId !== undefined && { managerId: fields.managerId }),
        ...(fields.departmentId !== undefined && { departmentId: fields.departmentId }),
      },
      select: { id: true, name: true, email: true, role: true, managerId: true, departmentId: true, manager: { select: { name: true } }, department: { select: { name: true } } },
    });

    await logAudit("User", id, "UPDATED", session.user.id, target, fields);

    // Notify user for each changed field
    const changes: string[] = [];
    if (fields.name !== undefined && fields.name !== target.name) changes.push(`Name → ${fields.name}`);
    if (fields.email !== undefined && fields.email !== target.email) changes.push(`Email → ${fields.email}`);
    if (fields.role !== undefined && fields.role !== target.role) changes.push(`Role → ${fields.role.charAt(0) + fields.role.slice(1).toLowerCase()}`);
    if (fields.managerId !== undefined && fields.managerId !== target.managerId) changes.push(`Manager → ${updated.manager?.name ?? "None"}`);
    if (fields.departmentId !== undefined && fields.departmentId !== target.departmentId) changes.push(`Department → ${updated.department?.name ?? "None"}`);

    if (changes.length > 0) {
      await notify(id, "profile_updated", "Your profile was updated by an admin", changes.join(" · "), "/employee");
    }

    return NextResponse.json(updated);
  }

  // ── Manager: transfer own direct report only ───────────────────────────────
  if (session.user.role === "MANAGER") {
    const parsed = ManagerTransferBody.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const target = await db.user.findUnique({ where: { id, managerId: session.user.id }, select: { managerId: true } });
    if (!target) return NextResponse.json({ error: "Not your direct report" }, { status: 403 });

    const updated = await db.user.update({ where: { id }, data: { managerId: parsed.data.managerId }, select: { id: true, managerId: true, manager: { select: { name: true } } } });
    await logAudit("User", id, "MANAGER_TRANSFERRED", session.user.id, { managerId: target.managerId }, { managerId: parsed.data.managerId });
    await notify(id, "profile_updated", "Your manager has changed", `Manager → ${updated.manager?.name ?? "None"}`, "/employee");
    return NextResponse.json({ id: updated.id, managerId: updated.managerId });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function DELETE(_req: Request, ctx: { params: Promise<Record<string, string>> }) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await ctx.params;

  if (id === session.user.id) {
    return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
  }

  const target = await db.user.findUnique({ where: { id }, select: { name: true, email: true } });
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Cascade in dependency order
  const sheets = await db.goalSheet.findMany({ where: { employeeId: id }, select: { id: true, goals: { select: { id: true } } } });
  const goalIds = sheets.flatMap((s) => s.goals.map((g) => g.id));
  // GoalAchievement has onDelete: Cascade on goalId — deleted with goals
  if (goalIds.length > 0) await db.goal.deleteMany({ where: { id: { in: goalIds } } });
  await db.goalSheet.deleteMany({ where: { employeeId: id } });
  await db.goalSheet.updateMany({ where: { approvedById: id }, data: { approvedById: null } });
  await db.checkinComment.deleteMany({ where: { managerId: id } });
  await db.notification.deleteMany({ where: { userId: id } });
  await db.escalationEvent.updateMany({ where: { resolvedById: id }, data: { resolvedById: null } });
  await db.user.updateMany({ where: { managerId: id }, data: { managerId: null } });
  await db.auditLog.deleteMany({ where: { changedById: id } });
  await db.user.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
