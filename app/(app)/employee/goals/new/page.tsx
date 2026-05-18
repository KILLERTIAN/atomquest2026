import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { GoalSheetForm } from "@/components/goals/GoalSheetForm";
import { redirect } from "next/navigation";

export default async function NewGoalPage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const session = await auth();
  if (!session) redirect("/login");

  const { edit } = await searchParams;

  const activeCycle = await db.goalCycle.findFirst({ where: { isActive: true } });
  if (!activeCycle) redirect("/employee/goals");

  const cycles = await db.goalCycle.findMany({
    where: { isActive: true },
    orderBy: { openDate: "desc" },
  });

  let existingSheet = null;
  if (edit) {
    existingSheet = await db.goalSheet.findUnique({
      where: { id: edit, employeeId: session.user.id },
      include: { goals: true },
    });
  }

  return (
    <div style={{ maxWidth: "760px" }}>
      <div style={{ marginBottom: "28px" }}>
        <div style={{ fontSize: "11px", fontFamily: "var(--font-jetbrains-mono)", textTransform: "uppercase", letterSpacing: "0.07em", color: "oklch(0.58 0.018 80)", marginBottom: "6px" }}>
          employee · goals
        </div>
        <h1 style={{ fontSize: "clamp(28px, 4vw, 38px)", fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.1, margin: 0 }}>
          {existingSheet ? "Edit goal sheet." : "Create goal sheet."}
        </h1>
        <p style={{ marginTop: "8px", fontSize: "14px", color: "oklch(0.50 0.018 75)", lineHeight: 1.6 }}>
          Add up to 8 goals. Weights must total 100% before you can submit for approval.
        </p>
      </div>
      <GoalSheetForm cycles={cycles} existingSheet={existingSheet} />
    </div>
  );
}
