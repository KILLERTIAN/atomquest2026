import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notify } from "@/lib/notify";
import { sendSharedGoalCard } from "@/lib/teams";
import { NextResponse } from "next/server";
import { z } from "zod";

const Body = z.object({
  employeeIds: z.array(z.string()).min(1),
  cycleId: z.string(),
  thrustArea: z.string(),
  title: z.string(),
  description: z.string().optional(),
  uomType: z.enum(["NUMERIC_MIN", "NUMERIC_MAX", "TIMELINE", "ZERO"]),
  targetValue: z.number().optional().nullable(),
  targetDate: z.string().optional().nullable(),
  weightage: z.number().min(10).max(100),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session || (session.user.role !== "MANAGER" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = Body.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { employeeIds, cycleId, ...goalData } = parsed.data;
  const created = [];

  for (const empId of employeeIds) {
    let sheet = await db.goalSheet.findFirst({
      where: { employeeId: empId, cycleId },
    });

    if (!sheet) {
      sheet = await db.goalSheet.create({
        data: { employeeId: empId, cycleId },
      });
    }

    const goal = await db.goal.create({
      data: {
        sheetId: sheet.id,
        thrustArea: goalData.thrustArea,
        title: goalData.title,
        description: goalData.description,
        uomType: goalData.uomType,
        targetValue: goalData.targetValue ?? null,
        targetDate: goalData.targetDate ? new Date(goalData.targetDate) : null,
        weightage: goalData.weightage,
        isShared: true,
      },
    });
    created.push(goal);

    await notify(
      empId,
      "shared_goal",
      "New shared goal assigned",
      `${goalData.thrustArea} · ${goalData.title}`,
      "/employee/goals",
    );
  }

  await sendSharedGoalCard(
    session.user.name ?? "Manager",
    goalData.title,
    goalData.thrustArea,
    employeeIds.length,
  );

  return NextResponse.json(created, { status: 201 });
}
