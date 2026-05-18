import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? "completion";

  if (type === "completion") {
    const phaseLabel: Record<string, string> = {
      GOAL_SETTING: "Goal Setting",
      Q1: "Q1 Check-in",
      Q2: "Q2 Check-in",
      Q3: "Q3 Check-in",
      Q4: "Q4 Check-in",
    };
    const cycles = await db.goalCycle.findMany({ orderBy: { openDate: "desc" } });
    const data = await Promise.all(
      cycles.map(async (c) => {
        const total = await db.goalSheet.count({ where: { cycleId: c.id } });
        const approved = await db.goalSheet.count({ where: { cycleId: c.id, status: "APPROVED" } });
        const label = `FY ${c.year} · ${phaseLabel[c.phase] ?? c.phase}`;
        return { cycle: label, total, approved, rate: total ? ((approved / total) * 100).toFixed(1) : "0" };
      })
    );
    return NextResponse.json(data);
  }

  if (type === "qoq") {
    const quarters = ["Q1", "Q2", "Q3", "Q4"] as const;
    const data = await Promise.all(
      quarters.map(async (q) => {
        const achievements = await db.goalAchievement.findMany({
          where: { quarter: q, computedScore: { not: null } },
          select: { computedScore: true },
        });
        const avg = achievements.length
          ? achievements.reduce((s, a) => s + (a.computedScore ?? 0), 0) / achievements.length
          : 0;
        return { quarter: q, avgScore: parseFloat(avg.toFixed(3)), count: achievements.length };
      })
    );
    return NextResponse.json(data);
  }

  if (type === "distribution") {
    const byThrust = await db.goal.groupBy({ by: ["thrustArea"], _count: { id: true } });
    const byUom = await db.goal.groupBy({ by: ["uomType"], _count: { id: true } });
    return NextResponse.json({ byThrust, byUom });
  }

  if (type === "managers") {
    const managers = await db.user.findMany({
      where: { role: "MANAGER" },
      include: {
        reports: {
          include: {
            goalSheets: {
              include: { checkinComments: true },
            },
          },
        },
      },
    });

    const data = managers.map((m) => {
      const allSheets = m.reports.flatMap((r) => r.goalSheets);
      const withCheckin = allSheets.filter((s) => s.checkinComments.length > 0);
      return {
        manager: m.name,
        totalReports: m.reports.length,
        sheetsWithCheckin: withCheckin.length,
        totalSheets: allSheets.length,
        rate: allSheets.length ? ((withCheckin.length / allSheets.length) * 100).toFixed(1) : "0",
      };
    });

    return NextResponse.json(data);
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}
