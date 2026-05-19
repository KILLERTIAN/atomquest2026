import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHeader, Panel, StatusPill, Icon, WeightBar } from "@/components/app/ui";
import { GoalSheetSubmitButton } from "./GoalSheetSubmitButton";

const UOM_LABEL: Record<string, string> = {
  NUMERIC_MIN: "Numeric ↑", NUMERIC_MAX: "Numeric ↓", TIMELINE: "Timeline", ZERO: "Zero-based",
};

const THRUST_COLORS: Record<string, string> = {
  Engineering: "oklch(0.93 0.06 240)", Quality: "oklch(0.93 0.06 140)",
  Operations: "oklch(0.93 0.06 50)", Product: "oklch(0.93 0.06 290)",
  People: "oklch(0.93 0.06 10)", Finance: "oklch(0.93 0.06 180)",
};

function thrustColor(area: string) {
  return THRUST_COLORS[area] ?? "oklch(0.93 0.04 80)";
}

export default async function GoalSheetPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return null;
  const { id } = await params;

  const sheet = await db.goalSheet.findUnique({
    where: { id },
    include: {
      goals: { include: { achievements: { orderBy: { quarter: "asc" } } } },
      cycle: true,
      approvedBy: { select: { name: true } },
    },
  });

  if (!sheet || sheet.employeeId !== session.user.id) notFound();

  const totalWeight = sheet.goals.reduce((s, g) => s + g.weightage, 0);
  const canEdit = sheet.status === "DRAFT" || sheet.status === "RETURNED";
  const canSubmit = canEdit && Math.abs(totalWeight - 100) < 0.01 && sheet.goals.length > 0;

  return (
    <div className="space-y-5 fade-up" style={{ maxWidth: "820px" }}>
      <PageHeader
        eyebrow={`employee · goals · ${sheet.cycle.year}`}
        title={`${sheet.cycle.year} — ${sheet.cycle.phase.replace("_", " ")}`}
        lede={`${sheet.goals.length} goal${sheet.goals.length !== 1 ? "s" : ""} · ${totalWeight}% weighted${sheet.approvedBy ? ` · approved by ${sheet.approvedBy.name}` : ""}`}
        actions={
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <StatusPill status={sheet.status.toLowerCase() as "draft" | "submitted" | "approved" | "returned"} />
            {canEdit && (
              <Link href={`/employee/goals/new?edit=${id}`} className="btn-ghost" style={{ fontSize: "12px", padding: "7px 14px" }}>
                Edit goals
              </Link>
            )}
            {canSubmit && <GoalSheetSubmitButton sheetId={id} />}
          </div>
        }
      />

      {/* Return note callout */}
      {sheet.returnNote && (
        <div style={{ display: "flex", gap: "14px", padding: "16px 20px", borderRadius: "12px", background: "oklch(0.97 0.04 55)", border: "1px solid oklch(0.88 0.08 55)", borderLeft: "4px solid oklch(0.72 0.18 50)" }}>
          <div style={{ flexShrink: 0, marginTop: "1px" }}><Icon name="bell" size={16} /></div>
          <div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "oklch(0.50 0.14 50)", textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "var(--font-jetbrains-mono)", marginBottom: "4px" }}>Manager feedback · returned for revision</div>
            <p style={{ margin: 0, fontSize: "13.5px", lineHeight: 1.6, color: "oklch(0.28 0.08 55)", fontStyle: "italic" }}>&ldquo;{sheet.returnNote}&rdquo;</p>
          </div>
        </div>
      )}

      {/* Goal cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {sheet.goals.map((goal, i) => {
          const ach = goal.achievements;
          const scored = ach.filter((a) => a.computedScore != null);
          const avgScore = scored.length > 0 ? scored.reduce((s, a) => s + (a.computedScore ?? 0), 0) / scored.length : null;

          return (
            <div key={goal.id} className="panel">
              <div style={{ padding: "18px 20px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", flex: 1 }}>
                    <div style={{ width: "34px", height: "34px", borderRadius: "10px", background: "oklch(0.96 0.07 92)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "1px" }}>
                      <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--brand-deep)", fontFamily: "var(--font-jetbrains-mono)" }}>{i + 1}</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "6px" }}>
                        <span style={{ fontWeight: 600, fontSize: "14px", color: "var(--ink)" }}>{goal.title}</span>
                        {goal.isShared && <span className="pill shared">shared</span>}
                        {goal.isLocked && <span className="pill" style={{ background: "oklch(0.92 0.01 80)", color: "var(--ink-mute)", fontSize: "10px" }}>locked</span>}
                      </div>
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
                        <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "99px", background: thrustColor(goal.thrustArea), color: "oklch(0.25 0.06 80)", fontWeight: 600 }}>{goal.thrustArea}</span>
                        <span style={{ fontSize: "11px", color: "var(--ink-mute)", fontFamily: "var(--font-jetbrains-mono)" }}>{UOM_LABEL[goal.uomType] ?? goal.uomType}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px", flexShrink: 0 }}>
                    <span style={{ fontSize: "22px", fontWeight: 700, fontFamily: "var(--font-instrument-serif)", color: "var(--brand-deep)", lineHeight: 1 }}>{goal.weightage}%</span>
                    {avgScore != null && (
                      <span style={{ fontSize: "11px", fontWeight: 600, fontFamily: "var(--font-jetbrains-mono)", color: avgScore >= 1 ? "var(--ok)" : avgScore >= 0.7 ? "oklch(0.65 0.16 88)" : "oklch(0.58 0.14 50)" }}>
                        avg {(avgScore * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>
                </div>

                {/* Description + targets row */}
                {(goal.description || goal.targetValue != null || goal.targetDate) && (
                  <div style={{ marginTop: "14px", paddingTop: "12px", borderTop: "1px dashed var(--line)", display: "flex", gap: "20px", flexWrap: "wrap", alignItems: "flex-start" }}>
                    {goal.description && (
                      <p style={{ margin: 0, fontSize: "13px", color: "var(--ink-mute)", lineHeight: 1.6, flex: "1 1 180px" }}>{goal.description}</p>
                    )}
                    <div style={{ display: "flex", gap: "20px", flexShrink: 0 }}>
                      {goal.targetValue != null && (
                        <div>
                          <div style={{ fontSize: "9px", color: "var(--ink-mute)", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "var(--font-jetbrains-mono)", marginBottom: "2px" }}>Target</div>
                          <div style={{ fontSize: "18px", fontWeight: 700, fontFamily: "var(--font-jetbrains-mono)", color: "var(--ink)" }}>{goal.targetValue}</div>
                        </div>
                      )}
                      {goal.targetDate && (
                        <div>
                          <div style={{ fontSize: "9px", color: "var(--ink-mute)", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "var(--font-jetbrains-mono)", marginBottom: "2px" }}>Deadline</div>
                          <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--ink)" }}>{new Date(goal.targetDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Goal-setting: check-ins not yet open */}
                {sheet.status === "APPROVED" && sheet.cycle.phase === "GOAL_SETTING" && (
                  <div style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontSize: "11px", color: "var(--ink-mute)", fontFamily: "var(--font-jetbrains-mono)", background: "var(--bg-elev)", padding: "3px 10px", borderRadius: "6px", border: "1px solid var(--line)" }}>
                      Check-in window opens when cycle advances to Q1 · Apr – Jun
                    </span>
                  </div>
                )}

                {/* Quarterly achievements — show only quarters with data (or the cycle's own quarter) */}
                {sheet.status === "APPROVED" && sheet.cycle.phase !== "GOAL_SETTING" && (() => {
                  const activeQuarters = (["Q1", "Q2", "Q3", "Q4"] as const).filter(
                    (q) => q === sheet.cycle.phase || ach.some((a) => a.quarter === q)
                  );
                  if (activeQuarters.length === 0) return null;
                  return (
                    <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px solid var(--line)", display: "grid", gridTemplateColumns: `repeat(${activeQuarters.length}, 1fr)`, gap: "8px" }}>
                      {activeQuarters.map((q) => {
                        const a = ach.find((x) => x.quarter === q);
                        const sc = a?.computedScore;
                        const scoreColor = sc == null ? "var(--ink-mute)" : sc >= 1 ? "var(--ok)" : sc >= 0.7 ? "oklch(0.65 0.16 88)" : "oklch(0.55 0.14 50)";
                        const isActive = q === sheet.cycle.phase;
                        return (
                          <div key={q} style={{ background: isActive ? "oklch(0.95 0.05 92)" : "var(--bg-elev)", borderRadius: "10px", padding: "10px 12px", textAlign: "center", border: isActive ? "1px solid oklch(0.88 0.08 88)" : "1px solid transparent" }}>
                            <div style={{ fontSize: "9px", fontWeight: 700, color: isActive ? "oklch(0.50 0.12 80)" : "var(--ink-mute)", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "var(--font-jetbrains-mono)", marginBottom: "5px" }}>{q}</div>
                            <div style={{ fontSize: "18px", fontWeight: 700, color: "var(--ink)", fontFamily: "var(--font-jetbrains-mono)", lineHeight: 1 }}>
                              {a?.actualValue != null ? a.actualValue : a?.actualDate ? new Date(a.actualDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : <span style={{ color: "var(--ink-mute)", fontWeight: 400, fontSize: "14px" }}>not logged</span>}
                            </div>
                            {sc != null && (
                              <div style={{ fontSize: "11px", color: scoreColor, marginTop: "3px", fontFamily: "var(--font-jetbrains-mono)", fontWeight: 600 }}>{sc.toFixed(2)}×</div>
                            )}
                            {a && (
                              <div style={{ fontSize: "9px", color: "var(--ink-mute)", marginTop: "2px", textTransform: "uppercase", letterSpacing: "0.04em" }}>{a.status.replace("_", " ")}</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
              {/* Full-width weight indicator at card bottom */}
              <div style={{ height: "4px", background: `linear-gradient(90deg, var(--brand) ${goal.weightage}%, var(--line) ${goal.weightage}%)` }} />
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {sheet.goals.length === 0 && (
        <Panel title="No goals yet" sub="Add goals before submitting.">
          <div style={{ textAlign: "center", padding: "28px 0" }}>
            <div style={{ fontSize: "13px", color: "var(--ink-mute)", marginBottom: "14px" }}>Eight slots. One hundred percent. One quarter.</div>
            <Link href={`/employee/goals/new?edit=${id}`} className="btn-primary" style={{ display: "inline-flex" }}>
              <Icon name="plus" size={14} /> Add goals
            </Link>
          </div>
        </Panel>
      )}

      {/* Weight summary panel */}
      {sheet.goals.length > 0 && (
        <Panel title="Weight distribution" sub="Must total exactly 100% to submit">
          <WeightBar goals={sheet.goals.map((g) => ({ weight: g.weightage, title: g.title }))} className="weight-bar-standalone" />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px" }}>
            <span style={{ fontSize: "12px", color: "var(--ink-mute)", fontFamily: "var(--font-jetbrains-mono)" }}>{totalWeight}% of 100% allocated</span>
            {Math.abs(totalWeight - 100) > 0.01 && (
              <span style={{ fontSize: "12px", color: "var(--warn)", fontFamily: "var(--font-jetbrains-mono)" }}>
                {totalWeight < 100 ? `${(100 - totalWeight).toFixed(0)}% unallocated` : `${(totalWeight - 100).toFixed(0)}% over`}
              </span>
            )}
          </div>
        </Panel>
      )}
    </div>
  );
}
