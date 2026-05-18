import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { PageHeader, Panel, Avatar, StatusPill, Icon } from "@/components/app/ui";

const TONES = [
  "oklch(0.92 0.10 92)", "oklch(0.92 0.07 50)", "oklch(0.90 0.05 200)",
  "oklch(0.90 0.04 140)", "oklch(0.90 0.05 30)", "oklch(0.92 0.05 270)",
];

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
  const others  = sheets.filter((s) => s.status !== "SUBMITTED");

  return (
    <div className="space-y-5 fade-up">
      <PageHeader
        eyebrow="manager · approvals"
        title="Review queue."
        lede={`${pending.length} sheet${pending.length !== 1 ? "s" : ""} waiting for your call · ${sheets.filter((s) => s.status === "APPROVED").length} approved this cycle`}
        actions={
          <button className="btn-secondary"><Icon name="filter" size={14} /> Filter</button>
        }
      />

      {pending.length > 0 && (
        <Panel title={`Needs review · ${pending.length}`} sub="Submitted and awaiting your approval or return">
          <div className="approve-stack">
            {pending.map((sheet, i) => (
              <div key={sheet.id} className="approve-stack-row">
                <Avatar name={sheet.employee.name} tone={TONES[i % TONES.length]} size={42} />
                <div className="as-meta">
                  <div className="as-n">
                    {sheet.employee.name}
                    <span className="font-mono text-xs" style={{ color: "var(--ink-mute)", marginLeft: "8px" }}>
                      · {sheet.submittedAt ? new Date(sheet.submittedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "just now"}
                    </span>
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--ink-mute)" }}>
                    {sheet.goals.length} goals · {sheet.goals.reduce((s, g) => s + g.weightage, 0)}% weight · {sheet.cycle.year} {sheet.cycle.phase.replace("_", " ")}
                  </div>
                </div>
                <Link href={`/manager/approvals/${sheet.id}`} className="btn-ghost" style={{ fontSize: "12px", padding: "6px 10px" }}>Return</Link>
                <Link href={`/manager/approvals/${sheet.id}`} className="btn-primary" style={{ fontSize: "12px", padding: "6px 12px" }}>
                  Review <Icon name="arrow" size={11} />
                </Link>
              </div>
            ))}
          </div>
        </Panel>
      )}

      <Panel title="All sheets" sub="Full history for your direct reports" noPadding>
        <table className="audit-tbl">
          <thead>
            <tr><th>Employee</th><th>Cycle</th><th>Goals</th><th>Status</th><th>Submitted</th><th></th></tr>
          </thead>
          <tbody>
            {sheets.map((sheet, i) => (
              <tr key={sheet.id}>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <Avatar name={sheet.employee.name} tone={TONES[i % TONES.length]} size={28} />
                    <div>
                      <div style={{ fontWeight: 500, fontSize: "13.5px" }}>{sheet.employee.name}</div>
                      <div className="font-mono text-xs" style={{ color: "var(--ink-mute)" }}>{sheet.employee.email}</div>
                    </div>
                  </div>
                </td>
                <td className="font-mono text-xs" style={{ color: "var(--ink-mute)" }}>{sheet.cycle.year} · {sheet.cycle.phase.replace("_", " ")}</td>
                <td className="font-mono text-sm">{sheet.goals.length}</td>
                <td><StatusPill status={sheet.status.toLowerCase() as "draft" | "submitted" | "approved" | "returned"} /></td>
                <td className="font-mono text-xs" style={{ color: "var(--ink-mute)" }}>
                  {sheet.submittedAt ? new Date(sheet.submittedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—"}
                </td>
                <td>
                  <Link href={`/manager/approvals/${sheet.id}`} className="btn-row">
                    {sheet.status === "SUBMITTED" ? "Review →" : "Open"}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
