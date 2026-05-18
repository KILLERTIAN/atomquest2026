import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/app/ui";
import SharedGoalClient from "./SharedGoalClient";

export default async function SharedGoalsPage() {
  const session = await auth();
  if (!session || (session.user.role !== "MANAGER" && session.user.role !== "ADMIN")) {
    redirect("/");
  }

  const [employees, cycles] = await Promise.all([
    db.user.findMany({
      where: session.user.role === "MANAGER"
        ? { managerId: session.user.id }
        : { role: "EMPLOYEE" },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
    db.goalCycle.findMany({
      orderBy: [{ year: "desc" }, { openDate: "desc" }],
      take: 10,
    }),
  ]);

  return (
    <div className="space-y-5 fade-up" style={{ maxWidth: "720px" }}>
      <PageHeader
        eyebrow="manager · shared goals"
        title="Push shared goal."
        lede="Assign a departmental KPI to multiple team members. Recipients can only adjust weightage."
      />
      <SharedGoalClient employees={employees} cycles={cycles.map((c) => ({ id: c.id, year: c.year, phase: c.phase }))} />
    </div>
  );
}
