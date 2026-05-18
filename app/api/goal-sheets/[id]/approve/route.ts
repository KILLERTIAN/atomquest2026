import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { goalApprovedEmail } from "@/lib/email";
import { notify } from "@/lib/notify";
import { sendGoalApprovedCard } from "@/lib/teams";
import { GoalSchema } from "@/lib/validations";
import { NextResponse } from "next/server";
import { z } from "zod";

const ApproveBody = z.object({
  goals: z.array(GoalSchema.extend({ id: z.string() })).optional(),
});

export async function POST(req: Request, ctx: { params: Promise<Record<string, string>> }) {
  const session = await auth();
  if (!session || (session.user.role !== "MANAGER" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await ctx.params;

  const sheet = await db.goalSheet.findUnique({
    where: { id },
    include: { goals: true, employee: { include: { manager: true } } },
  });

  if (!sheet) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (sheet.status !== "SUBMITTED") {
    return NextResponse.json({ error: "Sheet is not in submitted state" }, { status: 409 });
  }

  if (
    session.user.role === "MANAGER" &&
    sheet.employee.managerId !== session.user.id
  ) {
    return NextResponse.json({ error: "Not your direct report" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = ApproveBody.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  // Apply inline edits to goals before locking
  if (parsed.data.goals) {
    for (const edit of parsed.data.goals) {
      if (!edit.id) continue;
      await db.goal.update({
        where: { id: edit.id },
        data: {
          targetValue: edit.targetValue ?? null,
          targetDate: edit.targetDate ? new Date(edit.targetDate) : null,
          weightage: edit.weightage,
        },
      });
    }
  }

  // Lock all goals
  await db.goal.updateMany({ where: { sheetId: id }, data: { isLocked: true } });

  const updated = await db.goalSheet.update({
    where: { id },
    data: {
      status: "APPROVED",
      approvedAt: new Date(),
      approvedById: session.user.id,
    },
  });

  await logAudit("GoalSheet", id, "APPROVED", session.user.id, { status: "SUBMITTED" }, { status: "APPROVED" });
  await goalApprovedEmail(sheet.employee.email, sheet.employee.name);
  await notify(sheet.employee.id, "approve", "Goal sheet approved", "Your goals are now locked and active for the quarter.", `/employee/goals/${id}`);
  await sendGoalApprovedCard(sheet.employee.name, sheet.goals.length, id);

  return NextResponse.json(updated);
}
