"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageHeader, Panel, Avatar, Icon } from "@/components/app/ui";

const QUARTERS = ["Q1", "Q2", "Q3", "Q4"] as const;
const QUARTER_RANGE: Record<string, string> = {
  Q1: "Apr – Jun", Q2: "Jul – Sep", Q3: "Oct – Dec", Q4: "Jan – Mar",
};

interface Achievement { quarter: string; computedScore: number | null; status: string; }
interface Goal { weightage: number; achievements: Achievement[]; }
interface CheckinComment { quarter: string; }
interface Sheet {
  id: string;
  employee: { name: string; email: string };
  cycle: { year: number };
  goals: Goal[];
  checkinComments: CheckinComment[];
}

const DEMO_SHEETS: Sheet[] = [
  { id: "s1", employee: { name: "Anika Sharma",  email: "anika@atomberg.com"  }, cycle: { year: 2026 }, goals: [{ weightage: 30, achievements: [{ quarter: "Q2", computedScore: 1.0,  status: "COMPLETED"   }] }, { weightage: 25, achievements: [{ quarter: "Q2", computedScore: 1.08, status: "COMPLETED"   }] }, { weightage: 25, achievements: [{ quarter: "Q2", computedScore: 1.04, status: "COMPLETED"   }] }, { weightage: 20, achievements: [{ quarter: "Q2", computedScore: 0.98, status: "IN_PROGRESS" }] }], checkinComments: [{ quarter: "Q2" }] },
  { id: "s2", employee: { name: "Karan Verma",   email: "karan@atomberg.com"  }, cycle: { year: 2026 }, goals: [{ weightage: 35, achievements: [{ quarter: "Q2", computedScore: 0.0,  status: "IN_PROGRESS" }] }, { weightage: 30, achievements: [{ quarter: "Q2", computedScore: 0.82, status: "IN_PROGRESS" }] }, { weightage: 20, achievements: [{ quarter: "Q2", computedScore: 0.67, status: "IN_PROGRESS" }] }, { weightage: 15, achievements: [] }], checkinComments: [] },
  { id: "s3", employee: { name: "Devika Pillai", email: "devika@atomberg.com" }, cycle: { year: 2026 }, goals: [{ weightage: 40, achievements: [{ quarter: "Q2", computedScore: 1.31, status: "COMPLETED"   }] }, { weightage: 35, achievements: [{ quarter: "Q2", computedScore: 1.02, status: "COMPLETED"   }] }, { weightage: 25, achievements: [{ quarter: "Q2", computedScore: 1.0,  status: "COMPLETED"   }] }], checkinComments: [{ quarter: "Q2" }] },
  { id: "s4", employee: { name: "Hiren Thakur",  email: "hiren@atomberg.com"  }, cycle: { year: 2026 }, goals: [{ weightage: 40, achievements: [] }, { weightage: 35, achievements: [] }, { weightage: 25, achievements: [] }], checkinComments: [] },
  { id: "s5", employee: { name: "Mira Kapoor",   email: "mira@atomberg.com"   }, cycle: { year: 2026 }, goals: [{ weightage: 35, achievements: [{ quarter: "Q2", computedScore: 0.95, status: "IN_PROGRESS" }] }, { weightage: 30, achievements: [{ quarter: "Q2", computedScore: 0.97, status: "IN_PROGRESS" }] }, { weightage: 20, achievements: [{ quarter: "Q2", computedScore: 0.875, status: "IN_PROGRESS" }] }, { weightage: 15, achievements: [] }], checkinComments: [] },
];

function compositeScore(sheet: Sheet, q: string): number | null {
  const scored = sheet.goals.filter((g) => g.achievements.some((a) => a.quarter === q && a.computedScore !== null));
  if (!scored.length) return null;
  return sheet.goals.reduce((sum, g) => {
    const a = g.achievements.find((a) => a.quarter === q && a.computedScore !== null);
    return sum + (a ? (a.computedScore ?? 0) * (g.weightage / 100) : 0);
  }, 0);
}

function scoreColor(s: number | null) {
  if (s === null) return "var(--ink-mute)";
  if (s >= 1.1) return "oklch(0.50 0.14 140)";
  if (s >= 0.9) return "oklch(0.45 0.12 88)";
  if (s >= 0.7) return "oklch(0.52 0.14 50)";
  return "oklch(0.52 0.16 30)";
}

function avgScore(sheets: Sheet[], q: string) {
  const scores = sheets.map((s) => compositeScore(s, q)).filter((x): x is number => x !== null);
  if (!scores.length) return null;
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

export default function ManagerCheckInsOverview() {
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/goals?scope=team")
      .then((r) => r.json())
      .then((data) => setSheets(Array.isArray(data) && data.length > 0 ? data : DEMO_SHEETS))
      .catch(() => setSheets(DEMO_SHEETS))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-5 fade-up">
      <PageHeader
        eyebrow="manager · check-ins"
        title="All quarters."
        lede="Team check-in overview across Q1–Q4. Click a quarter to add notes and review actuals."
      />

      {/* Quarter cards */}
      {loading ? (
        <div style={{ padding: "40px 0", textAlign: "center", color: "var(--ink-mute)", fontSize: "13.5px" }}>Loading…</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "14px" }}>
          {QUARTERS.map((q) => {
            const avg = avgScore(sheets, q);
            const commented = sheets.filter((s) => s.checkinComments.some((c) => c.quarter === q)).length;
            const hasData = sheets.some((s) => s.goals.some((g) => g.achievements.some((a) => a.quarter === q)));
            return (
              <Link key={q} href={`/manager/check-ins/${q}`} style={{ textDecoration: "none" }}>
                <div
                  className="panel-hover"
                  style={{
                    padding: "20px 22px", borderRadius: "16px",
                    border: "1px solid var(--line)", background: "var(--surface-card)",
                    cursor: "pointer", display: "flex", flexDirection: "column", gap: "14px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: "11px", color: "var(--ink-mute)", textTransform: "uppercase", letterSpacing: "0.10em", marginBottom: "3px" }}>
                        {QUARTER_RANGE[q]}
                      </div>
                      <div style={{ fontSize: "22px", fontWeight: 700, color: "var(--ink)", lineHeight: 1 }}>{q}</div>
                    </div>
                    {avg != null ? (
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontFamily: "var(--font-serif)", fontSize: "32px", lineHeight: 1, color: scoreColor(avg) }}>
                          {avg.toFixed(2)}
                        </div>
                        <div style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: "10px", color: "var(--ink-mute)", marginTop: "2px" }}>avg team</div>
                      </div>
                    ) : (
                      <span className="pill" style={{ background: "oklch(0.95 0.01 80)", color: "var(--ink-mute)", fontSize: "11px" }}>no data</span>
                    )}
                  </div>

                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <span className="pill" style={{ background: "oklch(0.96 0.07 92)", color: "oklch(0.45 0.12 80)", fontSize: "11.5px" }}>
                      {commented}/{sheets.length} commented
                    </span>
                    {!hasData && (
                      <span className="pill" style={{ background: "oklch(0.96 0.01 80)", color: "var(--ink-mute)", fontSize: "11.5px" }}>
                        no actuals yet
                      </span>
                    )}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "12.5px", color: "var(--ink-mute)" }}>
                      {!hasData ? "Window not open" : commented === sheets.length ? "All commented ✓" : `${sheets.length - commented} pending`}
                    </span>
                    <Icon name="arrow" size={13} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Team matrix */}
      {!loading && sheets.length > 0 && (
        <Panel title="Team score matrix" sub="Composite per employee per quarter">
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--line)" }}>
                  <th style={{ textAlign: "left", padding: "8px 12px", fontSize: "11px", color: "var(--ink-mute)", fontFamily: "var(--font-jetbrains-mono)", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                    Employee
                  </th>
                  {QUARTERS.map((q) => (
                    <th key={q} style={{ textAlign: "center", padding: "8px 16px", fontSize: "11px", color: "var(--ink-mute)", fontFamily: "var(--font-jetbrains-mono)", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                      {q}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sheets.map((sheet, i) => (
                  <tr key={sheet.id} style={{ borderBottom: i < sheets.length - 1 ? "1px solid var(--line)" : "none" }}>
                    <td style={{ padding: "12px 12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                        <Avatar name={sheet.employee.name} size={28} />
                        <div>
                          <div style={{ fontWeight: 500, fontSize: "13px" }}>{sheet.employee.name}</div>
                          <div style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: "10px", color: "var(--ink-mute)" }}>{sheet.employee.email.split("@")[0]}</div>
                        </div>
                      </div>
                    </td>
                    {QUARTERS.map((q) => {
                      const sc = compositeScore(sheet, q);
                      return (
                        <td key={q} style={{ textAlign: "center", padding: "12px 16px" }}>
                          <Link href={`/manager/check-ins/${q}`} style={{ textDecoration: "none" }}>
                            <span style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: "13px", fontWeight: 700, color: scoreColor(sc) }}>
                              {sc != null ? sc.toFixed(2) : "—"}
                            </span>
                          </Link>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}
    </div>
  );
}
