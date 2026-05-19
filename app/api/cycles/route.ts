import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { CycleSchema } from "@/lib/validations";
import { cycleOpenedEmail } from "@/lib/email";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const cycles = await db.goalCycle.findMany({
    orderBy: [{ year: "desc" }, { openDate: "desc" }],
    include: { _count: { select: { goalSheets: true } } },
  });

  return NextResponse.json(cycles);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = CycleSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { openDate, closeDate } = parsed.data;
  if (new Date(openDate) >= new Date(closeDate)) {
    return NextResponse.json({ error: "openDate must be before closeDate" }, { status: 400 });
  }

  if (parsed.data.isActive) {
    await db.goalCycle.updateMany({ where: { isActive: true }, data: { isActive: false } });
  }

  const cycle = await db.goalCycle.create({
    data: {
      ...parsed.data,
      openDate: new Date(openDate),
      closeDate: new Date(closeDate),
    },
  });

  await logAudit("GoalCycle", cycle.id, "CREATED", session.user.id, {}, parsed.data);

  if (parsed.data.isActive) {
    const employees = await db.user.findMany({
      where: { role: "EMPLOYEE" },
      select: { email: true, name: true },
    });
    const cycleLabel = `${cycle.phase.replace("_", " ")} ${cycle.year}`;
    const deadline = new Date(cycle.closeDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
    await Promise.all(employees.map((emp) => cycleOpenedEmail(emp.email, emp.name, cycleLabel, deadline)));
  }

  return NextResponse.json(cycle, { status: 201 });
}

const PatchBody = z.object({
  openDate: z.string().optional(),
  closeDate: z.string().optional(),
  isActive: z.boolean().optional(),
  phase: z.enum(["GOAL_SETTING", "Q1", "Q2", "Q3", "Q4"]).optional(),
});

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const body = await req.json();
  const parsed = PatchBody.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const existing = await db.goalCycle.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const openDate = parsed.data.openDate ? new Date(parsed.data.openDate) : existing.openDate;
  const closeDate = parsed.data.closeDate ? new Date(parsed.data.closeDate) : existing.closeDate;
  if (openDate >= closeDate) {
    return NextResponse.json({ error: "openDate must be before closeDate" }, { status: 400 });
  }

  if (parsed.data.isActive) {
    await db.goalCycle.updateMany({ where: { isActive: true, id: { not: id } }, data: { isActive: false } });
  }

  const updated = await db.goalCycle.update({
    where: { id },
    data: {
      ...(parsed.data.openDate && { openDate }),
      ...(parsed.data.closeDate && { closeDate }),
      ...(parsed.data.isActive !== undefined && { isActive: parsed.data.isActive }),
      ...(parsed.data.phase && { phase: parsed.data.phase }),
    },
  });

  await logAudit("GoalCycle", id, "UPDATED", session.user.id, existing, parsed.data);

  return NextResponse.json(updated);
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const cycle = await db.goalCycle.findUnique({
    where: { id },
    include: { _count: { select: { goalSheets: true } } },
  });
  if (!cycle) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (cycle._count.goalSheets > 0) {
    return NextResponse.json({ error: "Cannot delete a cycle with existing goal sheets" }, { status: 409 });
  }

  await db.goalCycle.delete({ where: { id } });
  await logAudit("GoalCycle", id, "DELETED", session.user.id, cycle, {});

  return NextResponse.json({ ok: true });
}
