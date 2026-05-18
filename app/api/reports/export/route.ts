export const runtime = "nodejs";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
export async function GET(req: Request) {
  const XLSX = await import("xlsx");
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const cycleId = searchParams.get("cycleId");

  const sheets = await db.goalSheet.findMany({
    where: cycleId ? { cycleId } : {},
    include: {
      employee: { select: { name: true, email: true, department: { select: { name: true } } } },
      cycle: { select: { year: true, phase: true } },
      goals: { include: { achievements: true } },
    },
  });

  const rows: Record<string, unknown>[] = [];

  for (const sheet of sheets) {
    for (const goal of sheet.goals) {
      for (const q of ["Q1", "Q2", "Q3", "Q4"] as const) {
        const ach = goal.achievements.find((a) => a.quarter === q);
        rows.push({
          Employee: sheet.employee.name,
          Email: sheet.employee.email,
          Department: sheet.employee.department?.name ?? "",
          Year: sheet.cycle.year,
          Phase: sheet.cycle.phase,
          "Sheet Status": sheet.status,
          "Thrust Area": goal.thrustArea,
          "Goal Title": goal.title,
          "UoM Type": goal.uomType,
          "Target Value": goal.targetValue ?? "",
          "Target Date": goal.targetDate?.toISOString().split("T")[0] ?? "",
          Weightage: goal.weightage,
          Quarter: q,
          "Actual Value": ach?.actualValue ?? "",
          "Actual Date": ach?.actualDate?.toISOString().split("T")[0] ?? "",
          Status: ach?.status ?? "NOT_STARTED",
          "Computed Score": ach?.computedScore != null ? `${(ach.computedScore * 100).toFixed(1)}%` : "",
        });
      }
    }
  }

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Achievement Report");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="achievement-report-${Date.now()}.xlsx"`,
    },
  });
}
