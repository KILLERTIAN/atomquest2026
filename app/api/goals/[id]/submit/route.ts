import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { goalSubmittedEmail } from "@/lib/email";
import { notify } from "@/lib/notify";
import { sendGoalSubmittedCard } from "@/lib/teams";
import { NextResponse } from "next/server";

export async function POST(_req: Request, ctx: { params: Promise<Record<string, string>> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  const sheet = await db.goalSheet.findUnique({
    where: { id },
    include: { goals: true, employee: { include: { manager: true } } },
  });

  if (!sheet) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (sheet.employeeId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (sheet.status === "SUBMITTED" || sheet.status === "APPROVED") {
    return NextResponse.json({ error: "Already submitted" }, { status: 409 });
  }

  const total = sheet.goals.reduce((s, g) => s + g.weightage, 0);
  if (Math.abs(total - 100) > 0.01) {
    return NextResponse.json({ error: "Total weightage must equal 100%" }, { status: 400 });
  }

  const updated = await db.goalSheet.update({
    where: { id },
    data: { status: "SUBMITTED", submittedAt: new Date() },
  });

  await logAudit("GoalSheet", id, "SUBMITTED", session.user.id, { status: "DRAFT" }, { status: "SUBMITTED" });

  if (sheet.employee.manager) {
    await goalSubmittedEmail(sheet.employee.name, sheet.employee.manager.email, sheet.employee.manager.name);
    await notify(sheet.employee.manager.id, "submit", `${sheet.employee.name} submitted their goal sheet`, "Awaiting your review and approval.", `/manager/approvals/${id}`);
    await sendGoalSubmittedCard(sheet.employee.name, sheet.goals.length, id);
  }

  return NextResponse.json(updated);
}
