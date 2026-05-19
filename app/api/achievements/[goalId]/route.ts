import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { AchievementSchema } from "@/lib/validations";
import { computeScore } from "@/lib/score";
import { scorePublishedEmail } from "@/lib/email";
import { NextResponse } from "next/server";
import { z } from "zod";

const Body = AchievementSchema.extend({ quarter: z.enum(["Q1", "Q2", "Q3", "Q4"]) });

export async function PUT(req: Request, ctx: { params: Promise<Record<string, string>> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { goalId } = await ctx.params;

  const goal = await db.goal.findUnique({
    where: { id: goalId },
    include: { sheet: { include: { employee: true } } },
  });

  if (!goal) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (goal.sheet.employee.id !== session.user.id && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (goal.isShared && goal.primaryGoalId) {
    return NextResponse.json({ error: "Log actuals on the primary goal owner's copy" }, { status: 403 });
  }
  if (goal.sheet.status !== "APPROVED" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Goal sheet must be approved before logging actuals" }, { status: 409 });
  }

  const body = await req.json();
  const parsed = Body.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { quarter, actualValue, actualDate, status, notes } = parsed.data;

  // Enforce check-in window: an active cycle must exist with the matching quarter phase
  if (session.user.role !== "ADMIN") {
    const openCycle = await db.goalCycle.findFirst({
      where: { isActive: true, phase: quarter },
    });
    if (!openCycle) {
      return NextResponse.json(
        { error: `${quarter} check-in window is not currently open` },
        { status: 409 }
      );
    }
  }

  const actualDateObj = actualDate ? new Date(actualDate) : null;
  const score = computeScore(
    goal.uomType,
    goal.targetValue,
    goal.targetDate,
    actualValue ?? null,
    actualDateObj
  );

  const achievement = await db.goalAchievement.upsert({
    where: { goalId_quarter: { goalId, quarter } },
    create: { goalId, quarter, actualValue, actualDate: actualDateObj, status, notes, computedScore: score },
    update: { actualValue, actualDate: actualDateObj, status, notes, computedScore: score },
  });

  // Sync to shared copies in parallel
  if (!goal.primaryGoalId) {
    const copies = await db.goal.findMany({ where: { primaryGoalId: goalId }, select: { id: true } });
    await Promise.all(copies.map((copy) =>
      db.goalAchievement.upsert({
        where: { goalId_quarter: { goalId: copy.id, quarter } },
        create: { goalId: copy.id, quarter, actualValue, actualDate: actualDateObj, status, notes, computedScore: score },
        update: { actualValue, actualDate: actualDateObj, status, notes, computedScore: score },
      })
    ));
  }

  // Email employee when all goals in sheet are completed for this quarter
  if (status === "COMPLETED") {
    const sheet = await db.goalSheet.findUnique({
      where: { id: goal.sheet.id },
      include: {
        goals: { include: { achievements: { where: { quarter } } } },
        employee: { select: { email: true, name: true } },
        cycle: { select: { phase: true } },
      },
    });
    if (sheet) {
      const allDone = sheet.goals.every((g) =>
        g.achievements.some((a) => a.status === "COMPLETED")
      );
      if (allDone) {
        const totalScore = sheet.goals.reduce((sum, g) => {
          const ach = g.achievements.find((a) => a.quarter === quarter);
          return sum + (ach?.computedScore ?? 0) * (g.weightage / 100);
        }, 0);
        await scorePublishedEmail(
          sheet.employee.email,
          sheet.employee.name,
          quarter,
          (totalScore * 100).toFixed(1) + "%"
        );
      }
    }
  }

  await logAudit("GoalAchievement", achievement.id, "UPSERTED", session.user.id, {}, { goalId, quarter, status, computedScore: score });

  return NextResponse.json(achievement);
}
