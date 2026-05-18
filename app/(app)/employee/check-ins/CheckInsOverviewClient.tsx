"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageHeader, Panel, Icon } from "@/components/app/ui";

const QUARTERS = ["Q1", "Q2", "Q3", "Q4"] as const;
const QUARTER_RANGE: Record<string, string> = {
  Q1: "Apr – Jun", Q2: "Jul – Sep", Q3: "Oct – Dec", Q4: "Jan – Mar",
};
const WINDOW_OPENS: Record<string, string> = {
  Q1: "Window opens July", Q2: "Window opens October", Q3: "Window opens January", Q4: "Window opens March / April",
};

interface Achievement {
  quarter: string; actualValue: number | null; status: string; computedScore: number | null;
}
interface Goal {
  id: string; weightage: number; achievements: Achievement[];
}
interface GoalSheet {
  id: string; status: string; cycle: { year: number }; goals: Goal[];
}

// Demo data covers Q1–Q3 with realistic scores, Q4 not yet started
const DEMO_SHEETS: GoalSheet[] = [{
  id: "demo-sheet", status: "APPROVED", cycle: { year: 2026 },
  goals: [
    { id: "g1", weightage: 30, achievements: [
      { quarter: "Q1", actualValue: null, status: "COMPLETED", computedScore: 1.04 },
      { quarter: "Q2", actualValue: null, status: "COMPLETED", computedScore: 1.0  },
      { quarter: "Q3", actualValue: null, status: "ON_TRACK",  computedScore: 0.91 },
    ]},
    { id: "g2", weightage: 25, achievements: [
      { quarter: "Q1", actualValue: 0.71, status: "COMPLETED", computedScore: 1.13 },
      { quarter: "Q2", actualValue: 0.71, status: "ON_TRACK",  computedScore: 1.13 },
    ]},
    { id: "g3", weightage: 20, achievements: [
      { quarter: "Q1", actualValue: 3,   status: "COMPLETED",  computedScore: 0.98 },
      { quarter: "Q2", actualValue: 3,   status: "COMPLETED",  computedScore: 0.98 },
    ]},
    { id: "g4", weightage: 15, achievements: [
      { quarter: "Q1", actualValue: 4.1, status: "COMPLETED",  computedScore: 0.68 },
    ]},
    { id: "g5", weightage: 10, achievements: [] },
  ],
}];

// For each quarter, find the sheet that has data for that quarter and compute stats from it.
function quarterStats(sheets: GoalSheet[], q: string) {
  const sheetWithQ = sheets.find(s => s.goals.some(g => g.achievements.some(a => a.quarter === q)));

  if (!sheetWithQ) {
    const fallback = sheets[0];
    return { logged: 0, total: fallback?.goals.length ?? 0, score: null, done: false };
  }

  const goals = sheetWithQ.goals;
  const logged = goals.filter(g => g.achievements.some(a => a.quarter === q));
  const hasScore = goals.some(g => g.achievements.some(a => a.quarter === q && a.computedScore != null));
  const composite = goals.reduce((sum, g) => {
    const a = g.achievements.find(a => a.quarter === q && a.computedScore != null);
    return sum + (a ? (a.computedScore ?? 0) * (g.weightage / 100) : 0);
  }, 0);

  return {
    logged: logged.length,
    total: goals.length,
    score: hasScore ? composite : null,
    done: logged.length === goals.length && goals.length > 0,
  };
}

function scoreColor(s: number | null) {
  if (s === null) return "var(--ink-mute)";
  if (s >= 1.1) return "oklch(0.50 0.14 140)";
  if (s >= 0.9) return "oklch(0.45 0.12 88)";
  if (s >= 0.7) return "oklch(0.52 0.14 50)";
  return "oklch(0.52 0.16 30)";
}

export function CheckInsOverviewClient({ isDemo }: { isDemo: boolean }) {
  const [sheets, setSheets] = useState<GoalSheet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/goals")
      .then((r) => r.json())
      .then((data) => {
        const approved = (Array.isArray(data) ? data : []).filter((s: GoalSheet) => s.status === "APPROVED");
        if (approved.length > 0) {
          setSheets(approved);
        } else if (isDemo) {
          setSheets(DEMO_SHEETS);
        } else {
          setSheets([]);
        }
      })
      .catch(() => setSheets(isDemo ? DEMO_SHEETS : []))
      .finally(() => setLoading(false));
  }, [isDemo]);

  const year = sheets[0]?.cycle.year ?? 2026;

  return (
    <div className="space-y-5 fade-up">
      <PageHeader
        eyebrow={`FY ${year} · check-ins`}
        title="All quarters."
        lede="Overview of your Q1–Q4 actuals. Click a quarter to log or edit entries."
      />

      {loading ? (
        <div style={{ padding: "40px 0", textAlign: "center", color: "var(--ink-mute)", fontSize: "13.5px" }}>
          Loading…
        </div>
      ) : sheets.length === 0 ? (
        <div style={{ padding: "40px 24px", borderRadius: "16px", border: "1px solid var(--line)", background: "var(--surface-card)", textAlign: "center" }}>
          <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "oklch(0.96 0.07 92)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <Icon name="inbox" size={20} />
          </div>
          <div style={{ fontWeight: 600, fontSize: "15px", marginBottom: "6px" }}>No approved sheets yet</div>
          <div style={{ fontSize: "13px", color: "var(--ink-mute)", lineHeight: 1.6 }}>
            Your goal sheet needs to be approved before you can log actuals.
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "14px" }}>
          {QUARTERS.map((q) => {
            const stats = quarterStats(sheets, q);
            const pct = stats.total > 0 ? Math.round((stats.logged / stats.total) * 100) : 0;
            return (
              <Link key={q} href={`/employee/check-ins/${q}`} style={{ textDecoration: "none" }}>
                <div
                  className="panel-hover"
                  style={{
                    padding: "20px 22px",
                    borderRadius: "16px",
                    border: "1px solid var(--line)",
                    background: "var(--surface-card)",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    gap: "14px",
                    transition: "border-color 0.15s, box-shadow 0.15s",
                  }}
                >
                  {/* Header */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: "11px", color: "var(--ink-mute)", textTransform: "uppercase", letterSpacing: "0.10em", marginBottom: "3px" }}>
                        {QUARTER_RANGE[q]}
                      </div>
                      <div style={{ fontSize: "22px", fontWeight: 700, color: "var(--ink)", lineHeight: 1 }}>{q}</div>
                      <div style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: "10px", color: "var(--ink-mute)", marginTop: "3px", letterSpacing: "0.04em" }}>
                        {WINDOW_OPENS[q]}
                      </div>
                    </div>
                    {stats.score != null ? (
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontFamily: "var(--font-serif)", fontSize: "32px", lineHeight: 1, color: scoreColor(stats.score) }}>
                          {stats.score.toFixed(2)}
                        </div>
                        <div style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: "10px", color: "var(--ink-mute)", marginTop: "2px" }}>/ 1.5×</div>
                      </div>
                    ) : (
                      <span className="pill" style={{ background: "oklch(0.95 0.01 80)", color: "var(--ink-mute)", fontSize: "11px" }}>
                        no data
                      </span>
                    )}
                  </div>

                  {/* Progress bar */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                      <span style={{ fontSize: "12px", color: "var(--ink-mute)" }}>
                        {stats.total > 0 ? `${stats.logged} / ${stats.total} logged` : "—"}
                      </span>
                      {stats.done && (
                        <span style={{ fontSize: "11px", color: "var(--ok)", fontWeight: 600 }}>
                          <Icon name="check" size={11} /> done
                        </span>
                      )}
                    </div>
                    <div style={{ height: "5px", background: "oklch(0.93 0.01 90)", borderRadius: "999px", overflow: "hidden" }}>
                      <div style={{
                        height: "100%",
                        width: `${pct}%`,
                        background: stats.done ? "var(--ok)" : "var(--brand)",
                        borderRadius: "999px",
                        transition: "width 0.6s cubic-bezier(.2,.7,.2,1)",
                      }} />
                    </div>
                  </div>

                  {/* CTA hint */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "12.5px", color: "var(--ink-mute)" }}>
                      {stats.logged === 0 ? "Nothing logged yet" : stats.done ? "All actuals logged" : "In progress"}
                    </span>
                    <Icon name="arrow" size={13} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Full year summary */}
      {!loading && sheets.length > 0 && (
        <Panel title={`FY ${year} summary`} sub="Composite across all quarters">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1px", background: "var(--line)", borderRadius: "10px", overflow: "hidden" }}>
            {QUARTERS.map((q) => {
              const stats = quarterStats(sheets, q);
              return (
                <div key={q} style={{ background: "var(--surface-card)", padding: "16px", textAlign: "center" }}>
                  <div style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: "10px", color: "var(--ink-mute)", textTransform: "uppercase", marginBottom: "6px" }}>{q}</div>
                  <div style={{ fontSize: "20px", fontWeight: 700, color: scoreColor(stats.score), lineHeight: 1 }}>
                    {stats.score != null ? stats.score.toFixed(2) : "—"}
                  </div>
                  <div style={{ fontSize: "10px", color: "var(--ink-mute)", marginTop: "4px", fontFamily: "var(--font-jetbrains-mono)" }}>
                    {stats.logged}/{stats.total} goals
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      )}
    </div>
  );
}
