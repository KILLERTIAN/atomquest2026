import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/app/ui";
import { ApprovalsClient } from "./ApprovalsClient";


type Sheet = {
  id: string;
  status: string;
  submittedAt: Date | null;
  employee: { name: string; email: string };
  cycle: { year: number; phase: string };
  goals: { id: string; weightage: number }[];
};

const DEMO_SHEETS: Sheet[] = [
  { id: "demo-s1", status: "SUBMITTED", submittedAt: new Date("2026-05-16T07:31:00"), employee: { name: "Mira Kapoor",   email: "mira@atomberg.com"   }, cycle: { year: 2026, phase: "GOAL_SETTING" }, goals: Array(5).fill({ id: "", weightage: 20 }) },
  { id: "demo-s2", status: "SUBMITTED", submittedAt: new Date("2026-05-16T08:11:00"), employee: { name: "Anika Sharma",  email: "anika@atomberg.com"  }, cycle: { year: 2026, phase: "GOAL_SETTING" }, goals: Array(5).fill({ id: "", weightage: 20 }) },
  { id: "demo-s3", status: "APPROVED",  submittedAt: new Date("2026-05-14T10:00:00"), employee: { name: "Devika Pillai", email: "devika@atomberg.com" }, cycle: { year: 2026, phase: "GOAL_SETTING" }, goals: Array(4).fill({ id: "", weightage: 25 }) },
  { id: "demo-s4", status: "RETURNED",  submittedAt: new Date("2026-05-12T09:00:00"), employee: { name: "Karan Verma",   email: "karan@atomberg.com"  }, cycle: { year: 2026, phase: "GOAL_SETTING" }, goals: Array(6).fill({ id: "", weightage: 16 }) },
  { id: "demo-s5", status: "APPROVED",  submittedAt: new Date("2026-05-10T11:00:00"), employee: { name: "Sahil Bose",    email: "sahil@atomberg.com"  }, cycle: { year: 2026, phase: "GOAL_SETTING" }, goals: Array(5).fill({ id: "", weightage: 20 }) },
];

export default async function ApprovalsPage() {
  const session = await auth();
  if (!session) return null;

  let sheets: Sheet[] = DEMO_SHEETS;
  try {
    const reports = await db.user.findMany({
      where: { managerId: session.user.id },
      select: { id: true },
    });
    if (reports.length > 0) {
      const dbSheets = await db.goalSheet.findMany({
        where: { employeeId: { in: reports.map((r) => r.id) } },
        include: {
          employee: { select: { name: true, email: true } },
          cycle: { select: { year: true, phase: true } },
          goals: { select: { id: true, weightage: true } },
        },
        orderBy: { submittedAt: "desc" },
      });
      if (dbSheets.length > 0) sheets = dbSheets;
    }
  } catch {}

  const pending = sheets.filter((s) => s.status === "SUBMITTED");

  return (
    <div className="space-y-5 fade-up">
      <PageHeader
        eyebrow="manager · approvals"
        title="Review queue."
        lede={`${pending.length} sheet${pending.length !== 1 ? "s" : ""} waiting for your call · ${sheets.filter((s) => s.status === "APPROVED").length} approved this cycle`}
      />
      <ApprovalsClient sheets={sheets} />
    </div>
  );
}
