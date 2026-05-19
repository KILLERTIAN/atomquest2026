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
    const cycleIds = cycles.map((c) => c.id);

    const [totalGroups, approvedGroups] = await Promise.all([
      db.goalSheet.groupBy({ by: ["cycleId"], _count: { id: true }, where: { cycleId: { in: cycleIds } } }),
      db.goalSheet.groupBy({ by: ["cycleId"], _count: { id: true }, where: { cycleId: { in: cycleIds }, status: "APPROVED" } }),
    ]);

    const totalMap = Object.fromEntries(totalGroups.map((g) => [g.cycleId, g._count.id]));
    const approvedMap = Object.fromEntries(approvedGroups.map((g) => [g.cycleId, g._count.id]));

    const data = cycles.map((c) => {
      const total = totalMap[c.id] ?? 0;
      const approved = approvedMap[c.id] ?? 0;
      const label = `FY ${c.year} · ${phaseLabel[c.phase] ?? c.phase}`;
      return { cycle: label, total, approved, rate: total ? ((approved / total) * 100).toFixed(1) : "0" };
    });
    return NextResponse.json(data);
  }

  if (type === "qoq") {
    const { searchParams } = new URL(req.url);
    const yearParam = searchParams.get("year");
    const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();

    const activeCycles = await db.goalCycle.findMany({
      where: { year },
      select: { id: true, phase: true },
    });
    const cycleIds = activeCycles.map((c) => c.id);

    const groups = await db.goalAchievement.groupBy({
      by: ["quarter"],
      where: {
        computedScore: { not: null },
        goal: { sheet: { cycleId: { in: cycleIds } } },
      },
      _avg: { computedScore: true },
      _count: { id: true },
    });

    const quarters = ["Q1", "Q2", "Q3", "Q4"] as const;
    const data = quarters.map((q) => {
      const g = groups.find((x) => x.quarter === q);
      return {
        quarter: q,
        avgScore: g ? parseFloat((g._avg.computedScore ?? 0).toFixed(3)) : 0,
        count: g?._count.id ?? 0,
      };
    });
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

  if (type === "employees") {
    const { searchParams } = new URL(req.url);
    const cycleId = searchParams.get("cycleId");

    const employees = await db.user.findMany({
      where: { role: "EMPLOYEE" },
      select: {
        id: true,
        name: true,
        email: true,
        department: { select: { name: true } },
        goalSheets: {
          where: cycleId ? { cycleId } : {},
          include: {
            cycle: { select: { year: true, phase: true } },
            goals: {
              include: { achievements: { select: { quarter: true, status: true, computedScore: true } } },
            },
          },
        },
      },
    });

    const data = employees.map((emp) => {
      const quarters = ["Q1", "Q2", "Q3", "Q4"] as const;
      const sheet = emp.goalSheets[0] ?? null;
      const checkinStatus = quarters.reduce((acc, q) => {
        const allAchs = sheet?.goals.flatMap((g) => g.achievements.filter((a) => a.quarter === q)) ?? [];
        const done = allAchs.filter((a) => a.status !== "NOT_STARTED").length;
        acc[q] = { done, total: sheet?.goals.length ?? 0 };
        return acc;
      }, {} as Record<string, { done: number; total: number }>);

      const allAchs = sheet?.goals.flatMap((g) => g.achievements) ?? [];
      const scored = allAchs.filter((a) => a.computedScore != null);
      const avgScore = scored.length ? scored.reduce((s, a) => s + (a.computedScore ?? 0), 0) / scored.length : null;

      return {
        id: emp.id,
        name: emp.name,
        email: emp.email,
        department: emp.department?.name ?? "",
        sheetStatus: sheet?.status ?? "NONE",
        cycleLabel: sheet ? `FY ${sheet.cycle.year} · ${sheet.cycle.phase}` : "—",
        checkinStatus,
        avgScore: avgScore != null ? parseFloat(avgScore.toFixed(3)) : null,
      };
    });

    return NextResponse.json(data);
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}
