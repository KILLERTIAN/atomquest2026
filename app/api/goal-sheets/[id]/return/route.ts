import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { goalReturnedEmail } from "@/lib/email";
import { notify } from "@/lib/notify";
import { sendGoalReturnedCard } from "@/lib/teams";
import { NextResponse } from "next/server";
import { z } from "zod";

const Body = z.object({ note: z.string().min(1, "Return note is required") });

export async function POST(req: Request, ctx: { params: Promise<Record<string, string>> }) {
  const session = await auth();
  if (!session || (session.user.role !== "MANAGER" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const body = await req.json();
  const parsed = Body.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const sheet = await db.goalSheet.findUnique({
    where: { id },
    include: { employee: true },
  });
  if (!sheet) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (sheet.status !== "SUBMITTED") {
    return NextResponse.json({ error: "Sheet is not in submitted state" }, { status: 409 });
  }
  if (session.user.role === "MANAGER" && sheet.employee.managerId !== session.user.id) {
    return NextResponse.json({ error: "Not your direct report" }, { status: 403 });
  }

  const updated = await db.goalSheet.update({
    where: { id },
    data: { status: "RETURNED", returnNote: parsed.data.note },
  });

  await logAudit("GoalSheet", id, "RETURNED", session.user.id, { status: "SUBMITTED" }, { status: "RETURNED", note: parsed.data.note });
  await goalReturnedEmail(sheet.employee.email, sheet.employee.name, parsed.data.note);
  await notify(sheet.employee.id, "return", "Goal sheet returned for revision", parsed.data.note, `/employee/goals/${id}`);
  await sendGoalReturnedCard(sheet.employee.name, parsed.data.note, id);

  return NextResponse.json(updated);
}
