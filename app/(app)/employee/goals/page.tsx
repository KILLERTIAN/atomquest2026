import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { PageHeader, Panel, WeightBar, StatusPill, Icon } from "@/components/app/ui";

export default async function EmployeeGoalsPage() {
  const session = await auth();
  if (!session) return null;

  const [sheets, activeCycle] = await Promise.all([
    db.goalSheet.findMany({
      where: { employeeId: session.user.id },
      include: { goals: true, cycle: true },
      orderBy: { createdAt: "desc" },
    }),
    db.goalCycle.findFirst({ where: { isActive: true } }),
  ]);

  const totalWeight = (goals: { weightage: number }[]) =>
    goals.reduce((s, g) => s + g.weightage, 0);

  return (
    <div className="space-y-5 fade-up">
      <PageHeader
        eyebrow="employee · goals"
        title="My goal sheets."
        lede={`${sheets.length} sheet${sheets.length !== 1 ? "s" : ""} · set objectives, track progress, log actuals`}
        actions={
          activeCycle ? (
            <Link href="/employee/goals/new" className="btn-primary">
              <Icon name="plus" size={14} /> New goal sheet
            </Link>
          ) : undefined
        }
      />

      {/* Active cycle banner */}
      {activeCycle && (
        <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 18px", borderRadius: "14px", background: "oklch(0.96 0.07 92)", border: "1px solid oklch(0.88 0.08 92)" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "oklch(0.86 0.175 88)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon name="target" size={16} />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: "13.5px", color: "oklch(0.35 0.10 70)" }}>
              Active cycle: {activeCycle.year} — {activeCycle.phase.replace("_", " ")}
            </div>
            <div style={{ fontSize: "12px", color: "oklch(0.50 0.08 70)", marginTop: "1px" }}>
              Goal setting window is open
            </div>
          </div>
        </div>
      )}

      {!activeCycle && (
        <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 18px", borderRadius: "14px", background: "oklch(0.96 0.01 80)", border: "1px solid var(--line)" }}>
          <Icon name="clock" size={16} />
          <span style={{ fontSize: "13.5px", color: "var(--ink-mute)" }}>No active goal cycle. Creation is currently closed.</span>
        </div>
      )}

      {/* Empty state */}
      {sheets.length === 0 && (
        <Panel title="No goal sheets yet" sub="Create your first goal sheet to start setting objectives for this cycle.">
          <div className="text-center py-12">
            <div style={{ width: "52px", height: "52px", borderRadius: "16px", background: "oklch(0.96 0.07 92)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
              <Icon name="target" size={22} />
            </div>
            <div className="font-mono text-sm" style={{ color: "var(--ink-mute)", marginBottom: "16px" }}>
              Eight slots. One hundred percent. One quarter.
            </div>
            {activeCycle && (
              <Link href="/employee/goals/new" className="btn-primary" style={{ display: "inline-flex" }}>
                <Icon name="plus" size={14} /> Create goal sheet
              </Link>
            )}
          </div>
        </Panel>
      )}

      {/* Sheet list */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {sheets.map((sheet) => {
          const weight = totalWeight(sheet.goals);
          return (
            <Link
              key={sheet.id}
              href={`/employee/goals/${sheet.id}`}
              style={{ display: "flex", flexDirection: "column", gap: "0", textDecoration: "none" }}
            >
              <div className="panel panel-hover" style={{ cursor: "pointer" }}>
                <div style={{ padding: "16px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "oklch(0.96 0.07 92)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon name="target" size={18} />
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        <span style={{ fontWeight: 600, fontSize: "13.5px" }}>
                          {sheet.cycle.year} — {sheet.cycle.phase.replace("_", " ")}
                        </span>
                        <StatusPill status={sheet.status.toLowerCase() as "draft" | "submitted" | "approved" | "returned"} />
                      </div>
                      <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
                        <span className="font-mono text-xs" style={{ color: "var(--ink-mute)" }}>{sheet.goals.length} goal{sheet.goals.length !== 1 ? "s" : ""}</span>
                        <span className="font-mono text-xs" style={{ color: weight === 100 ? "var(--ok)" : "var(--warn)" }}>{weight}% weighted</span>
                        {sheet.returnNote && (
                          <span className="text-xs" style={{ color: "oklch(0.60 0.12 50)", maxWidth: "300px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            Note: {sheet.returnNote}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Icon name="arrow" size={16} />
                </div>

                {/* Weight bar — full width, no side padding */}
                {sheet.goals.length > 0 && (
                  <WeightBar goals={sheet.goals.map((g) => ({ weight: g.weightage, title: g.title }))} />
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
