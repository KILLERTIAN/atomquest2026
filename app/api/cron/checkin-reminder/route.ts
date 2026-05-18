import { db } from "@/lib/db";
import { checkInReminderEmail } from "@/lib/email";
import { sendCheckInReminderCard } from "@/lib/teams";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cycle = await db.goalCycle.findFirst({
    where: { isActive: true, phase: { in: ["Q1", "Q2", "Q3", "Q4"] } },
  });

  if (!cycle) return NextResponse.json({ skipped: true, reason: "No active check-in cycle" });

  const quarter = cycle.phase as "Q1" | "Q2" | "Q3" | "Q4";
  const deadline = cycle.closeDate.toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric",
  });

  // Employees with an approved sheet in this cycle who haven't started the current quarter
  const employees = await db.user.findMany({
    where: {
      role: "EMPLOYEE",
      goalSheets: {
        some: {
          cycleId: cycle.id,
          status: "APPROVED",
          goals: {
            none: {
              achievements: { some: { quarter, status: { not: "NOT_STARTED" } } },
            },
          },
        },
      },
    },
    select: { email: true, name: true },
  });

  await Promise.all(
    employees.map((emp) => checkInReminderEmail(emp.email, emp.name, quarter, deadline))
  );
  if (employees.length > 0) {
    await sendCheckInReminderCard(quarter, deadline, employees.length);
  }

  return NextResponse.json({ sent: employees.length, quarter });
}
