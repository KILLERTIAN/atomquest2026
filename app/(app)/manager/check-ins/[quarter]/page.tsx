"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Panel, PageHeader, Avatar, StatusPill, Icon, ActivityFeed } from "@/components/app/ui";
import { toast } from "sonner";

const QUARTER_LABELS: Record<string, string> = {
  Q1: "Apr – Jun", Q2: "Jul – Sep", Q3: "Oct – Dec", Q4: "Jan – Mar",
};

const DEMO_SHEETS = [
  {
    id: "s1",
    employee: { name: "Anika Sharma", email: "anika@atomberg.com" },
    cycle: { year: 2026, phase: "Q2" },
    status: "approved" as const,
    tone: "oklch(0.92 0.10 92)",
    goals: [
      { id: "g1", title: "Silent-mode firmware v3.1 release", weightage: 30, targetValue: 1, uomType: "ZERO", achievements: [{ quarter: "Q2", actualValue: 1, status: "COMPLETED", computedScore: 1.0 }] },
      { id: "g2", title: "MCU boot time < 420 ms",           weightage: 25, targetValue: 420, uomType: "NUMERIC_MAX", achievements: [{ quarter: "Q2", actualValue: 390, status: "COMPLETED", computedScore: 1.08 }] },
      { id: "g3", title: "Code coverage ≥ 85%",              weightage: 25, targetValue: 85,  uomType: "NUMERIC_MIN", achievements: [{ quarter: "Q2", actualValue: 88,  status: "COMPLETED", computedScore: 1.04 }] },
      { id: "g4", title: "OTA update success rate ≥ 98%",    weightage: 20, targetValue: 98,  uomType: "NUMERIC_MIN", achievements: [{ quarter: "Q2", actualValue: 96,  status: "IN_PROGRESS", computedScore: 0.98 }] },
    ],
    checkinComments: [
      { quarter: "Q2", comment: "Great progress on silent-mode. Boot time ahead of target — strong signal for the new chip platform.", manager: { name: "Riya Menon" } },
    ],
  },
  {
    id: "s2",
    employee: { name: "Karan Verma", email: "karan@atomberg.com" },
    cycle: { year: 2026, phase: "Q2" },
    status: "returned" as const,
    tone: "oklch(0.92 0.07 50)",
    goals: [
      { id: "g5", title: "BLE stack migration to v5.3",     weightage: 35, targetValue: 1,   uomType: "ZERO",        achievements: [{ quarter: "Q2", actualValue: 0,   status: "IN_PROGRESS", computedScore: 0.0  }] },
      { id: "g6", title: "Reduce field defect DPPM < 200",  weightage: 30, targetValue: 200, uomType: "NUMERIC_MAX", achievements: [{ quarter: "Q2", actualValue: 245, status: "IN_PROGRESS", computedScore: 0.82 }] },
      { id: "g7", title: "Cost-down: save ₹12 L on BOM",    weightage: 20, targetValue: 12,  uomType: "NUMERIC_MIN", achievements: [{ quarter: "Q2", actualValue: 8,   status: "IN_PROGRESS", computedScore: 0.67 }] },
      { id: "g8", title: "Vendor renegotiation by Jun 30",  weightage: 15, targetValue: 1,   uomType: "TIMELINE",    achievements: [{ quarter: "Q2", actualValue: null, status: "NOT_STARTED", computedScore: null }] },
    ],
    checkinComments: [],
  },
  {
    id: "s3",
    employee: { name: "Devika Pillai", email: "devika@atomberg.com" },
    cycle: { year: 2026, phase: "Q2" },
    status: "approved" as const,
    tone: "oklch(0.90 0.05 200)",
    goals: [
      { id: "g9",  title: "RMA rate < 0.8%",               weightage: 40, targetValue: 0.8, uomType: "NUMERIC_MAX", achievements: [{ quarter: "Q2", actualValue: 0.61, status: "COMPLETED",   computedScore: 1.31 }] },
      { id: "g10", title: "Audit closure rate ≥ 95%",       weightage: 35, targetValue: 95,  uomType: "NUMERIC_MIN", achievements: [{ quarter: "Q2", actualValue: 97,   status: "COMPLETED",   computedScore: 1.02 }] },
      { id: "g11", title: "SPC rollout to 3 lines",         weightage: 25, targetValue: 3,   uomType: "NUMERIC_MIN", achievements: [{ quarter: "Q2", actualValue: 3,    status: "COMPLETED",   computedScore: 1.0  }] },
    ],
    checkinComments: [
      { quarter: "Q2", comment: "Excellent quarter — RMA rate crushed the target. SPC rollout right on schedule.", manager: { name: "Riya Menon" } },
    ],
  },
  {
    id: "s4",
    employee: { name: "Hiren Thakur", email: "hiren@atomberg.com" },
    cycle: { year: 2026, phase: "Q2" },
    status: "draft" as const,
    tone: "oklch(0.90 0.04 140)",
    goals: [
      { id: "g12", title: "CI pipeline p95 < 8 min",        weightage: 40, targetValue: 8,  uomType: "NUMERIC_MAX", achievements: [{ quarter: "Q2", actualValue: null, status: "NOT_STARTED", computedScore: null }] },
      { id: "g13", title: "Test flakiness rate < 1%",        weightage: 35, targetValue: 1,  uomType: "NUMERIC_MAX", achievements: [{ quarter: "Q2", actualValue: null, status: "NOT_STARTED", computedScore: null }] },
      { id: "g14", title: "Dependency audit completed",      weightage: 25, targetValue: 1,  uomType: "ZERO",        achievements: [{ quarter: "Q2", actualValue: null, status: "NOT_STARTED", computedScore: null }] },
    ],
    checkinComments: [],
  },
  {
    id: "s5",
    employee: { name: "Mira Kapoor", email: "mira@atomberg.com" },
    cycle: { year: 2026, phase: "Q2" },
    status: "submitted" as const,
    tone: "oklch(0.90 0.05 30)",
    goals: [
      { id: "g15", title: "NPS score ≥ 62",                  weightage: 35, targetValue: 62, uomType: "NUMERIC_MIN", achievements: [{ quarter: "Q2", actualValue: 59,  status: "IN_PROGRESS", computedScore: 0.95 }] },
      { id: "g16", title: "Feature delivery on-time rate ≥ 90%", weightage: 30, targetValue: 90, uomType: "NUMERIC_MIN", achievements: [{ quarter: "Q2", actualValue: 87, status: "IN_PROGRESS", computedScore: 0.97 }] },
      { id: "g17", title: "Reduce P1 backlog by 40%",         weightage: 20, targetValue: 40, uomType: "NUMERIC_MIN", achievements: [{ quarter: "Q2", actualValue: 35,  status: "IN_PROGRESS", computedScore: 0.875 }] },
      { id: "g18", title: "Roadmap review with CXO by Jul 1", weightage: 15, targetValue: 1,  uomType: "TIMELINE",    achievements: [{ quarter: "Q2", actualValue: null, status: "NOT_STARTED", computedScore: null }] },
    ],
    checkinComments: [],
  },
];

const UOM_LABEL: Record<string, string> = {
  NUMERIC_MIN: "↑ min", NUMERIC_MAX: "↓ max", TIMELINE: "date", ZERO: "bool",
};

function scoreColor(score: number | null) {
  if (score === null) return "var(--ink-mute)";
  if (score >= 1.1) return "oklch(0.50 0.14 140)";
  if (score >= 0.9) return "oklch(0.45 0.12 88)";
  if (score >= 0.7) return "oklch(0.52 0.14 50)";
  return "oklch(0.52 0.16 30)";
}

function scoreLabel(score: number | null) {
  if (score === null) return "—";
  return `${score.toFixed(2)}×`;
}

function teamScore(sheet: typeof DEMO_SHEETS[0], q: string) {
  const achs = sheet.goals.flatMap((g) => g.achievements.filter((a) => a.quarter === q && a.computedScore !== null));
  if (!achs.length) return null;
  const weighted = sheet.goals.reduce((sum, g) => {
    const a = g.achievements.find((a) => a.quarter === q && a.computedScore !== null);
    return sum + (a ? (a.computedScore ?? 0) * (g.weightage / 100) : 0);
  }, 0);
  return weighted;
}

interface Sheet { id: string; employee: { name: string; email: string }; cycle: { year: number; phase: string }; goals: { id: string; title: string; weightage: number; targetValue: number | null; achievements: { quarter: string; actualValue: number | null; status: string; computedScore: number | null }[] }[]; checkinComments: { quarter: string; comment: string; manager: { name: string } }[]; }

export default function ManagerCheckInsPage() {
  const params = useParams();
  const quarter = (params.quarter as string).toUpperCase();

  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [usingDemo, setUsingDemo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch("/api/goals?scope=team")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setSheets(data);
        } else {
          setSheets(DEMO_SHEETS as unknown as Sheet[]);
          setUsingDemo(true);
        }
      })
      .catch(() => { setSheets(DEMO_SHEETS as unknown as Sheet[]); setUsingDemo(true); })
      .finally(() => setLoading(false));
  }, []);

  async function saveComment(sheetId: string) {
    const comment = comments[sheetId];
    if (!comment?.trim()) { toast.error("Comment is required"); return; }
    if (usingDemo) { toast.success("Check-in saved (demo)"); setComments((c) => ({ ...c, [sheetId]: "" })); return; }
    setSaving((s) => ({ ...s, [sheetId]: true }));
    const res = await fetch("/api/check-ins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goalSheetId: sheetId, quarter, comment }),
    });
    if (res.ok) { toast.success("Check-in comment saved"); setComments((c) => ({ ...c, [sheetId]: "" })); }
    else toast.error("Failed to save comment");
    setSaving((s) => ({ ...s, [sheetId]: false }));
  }

  const checkedIn = sheets.filter((s) => (s.checkinComments ?? []).some((c) => c.quarter === quarter)).length;
  const pending = sheets.length - checkedIn;
  const avgScore = (() => {
    const scored = sheets.map((s) => teamScore(s as unknown as typeof DEMO_SHEETS[0], quarter)).filter(Boolean) as number[];
    return scored.length ? (scored.reduce((a, b) => a + b, 0) / scored.length).toFixed(2) : null;
  })();

  return (
    <div className="space-y-5 fade-up">
      <PageHeader
        eyebrow={`manager · check-ins · ${quarter} '26`}
        title={`${quarter} Check-in review.`}
        lede={`${QUARTER_LABELS[quarter] ?? quarter} · ${sheets.length} reports · ${checkedIn} commented · ${pending} pending your note`}
        actions={
          <button className="btn-secondary"><Icon name="download" size={14} /> Export</button>
        }
      />

      {/* Summary stats */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-lbl">Team size</div>
          <div className="stat-val">{sheets.length}<span className="stat-unit"> reports</span></div>
          <div className="text-xs mt-2" style={{ color: "var(--ink-mute)" }}>Direct reports</div>
        </div>
        <div className="stat-card">
          <div className="stat-lbl">Commented</div>
          <div className="stat-val">{checkedIn}<span className="stat-unit"> / {sheets.length}</span></div>
          <div className="text-xs mt-2" style={{ color: "var(--ok)" }}>{checkedIn === sheets.length ? "All done ✓" : `${pending} left`}</div>
        </div>
        <div className="stat-card">
          <div className="stat-lbl">Avg team score</div>
          <div className="stat-val">{avgScore ?? "—"}<span className="stat-unit">{avgScore ? "×" : ""}</span></div>
          <div className="text-xs mt-2" style={{ color: "var(--ink-mute)" }}>Weighted · {quarter}</div>
        </div>
        <div className="stat-card">
          <div className="stat-lbl">On track (≥ 0.9×)</div>
          <div className="stat-val">
            {(() => {
              const scored = sheets.filter((s) => { const sc = teamScore(s as unknown as typeof DEMO_SHEETS[0], quarter); return sc !== null && sc >= 0.9; });
              return scored.length;
            })()}
            <span className="stat-unit"> / {sheets.length}</span>
          </div>
          <div className="text-xs mt-2" style={{ color: "var(--ink-mute)" }}>Weighted composite</div>
        </div>
      </div>

      {/* Per-employee cards */}
      {loading && (
        <Panel title="Loading…" sub="">
          <div style={{ padding: "40px", textAlign: "center", color: "var(--ink-mute)", fontFamily: "var(--font-jetbrains-mono)", fontSize: "13px" }}>Fetching team data…</div>
        </Panel>
      )}

      {!loading && sheets.map((sheet) => {
        const demo = sheet as unknown as typeof DEMO_SHEETS[0];
        const isOpen = expanded[sheet.id] ?? true;
        const ws = teamScore(demo, quarter);
        const existing = (sheet.checkinComments ?? []).filter((c) => c.quarter === quarter);
        const sheetStatus = (demo as { status?: string }).status as "approved" | "submitted" | "returned" | "draft" | undefined;

        return (
          <Panel
            key={sheet.id}
            title={sheet.employee?.name ?? "Unknown"}
            sub={`${sheet.cycle?.year} · ${quarter} · ${sheet.goals?.length ?? 0} goals`}
            action={
              <div className="flex items-center gap-2.5">
                {ws !== null && (
                  <span className="font-mono text-sm font-semibold" style={{ color: scoreColor(ws) }}>{ws.toFixed(2)}×</span>
                )}
                {sheetStatus && <StatusPill status={sheetStatus} />}
                <button
                  className="btn-ghost"
                  style={{ fontSize: 12, padding: "6px 10px" }}
                  onClick={() => setExpanded((e) => ({ ...e, [sheet.id]: !isOpen }))}
                >
                  {isOpen ? "Collapse" : "Expand"}
                </button>
              </div>
            }
          >
            {isOpen && (
              <div className="space-y-4">
                {/* Goals table */}
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--line)" }}>
                        {["Goal", "Type", "Wt", "Target", "Actual", "Status", "Score"].map((h) => (
                          <th key={h} style={{ textAlign: h === "Goal" ? "left" : "right", padding: "8px 10px", fontSize: "11px", color: "var(--ink-mute)", fontFamily: "var(--font-jetbrains-mono)", textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 600 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sheet.goals?.map((goal) => {
                        const ach = goal.achievements?.find((a) => a.quarter === quarter);
                        const sc = ach?.computedScore ?? null;
                        return (
                          <tr key={goal.id} style={{ borderBottom: "1px solid var(--line)" }}>
                            <td style={{ padding: "10px 10px", maxWidth: "260px" }}>
                              <span style={{ fontWeight: 500, fontSize: "13px" }}>{goal.title}</span>
                            </td>
                            <td style={{ textAlign: "right", padding: "10px 10px" }}>
                              <span style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: "11px", background: "var(--bg-elev)", color: "var(--ink-mute)", padding: "2px 6px", borderRadius: "4px" }}>
                                {UOM_LABEL[(goal as { uomType?: string }).uomType ?? ""] ?? "—"}
                              </span>
                            </td>
                            <td style={{ textAlign: "right", padding: "10px 10px", fontFamily: "var(--font-jetbrains-mono)", fontSize: "12px", color: "var(--ink-mute)" }}>{goal.weightage}%</td>
                            <td style={{ textAlign: "right", padding: "10px 10px", fontFamily: "var(--font-jetbrains-mono)", fontSize: "12px" }}>{goal.targetValue ?? "—"}</td>
                            <td style={{ textAlign: "right", padding: "10px 10px", fontFamily: "var(--font-jetbrains-mono)", fontSize: "12px", fontWeight: 600, color: ach?.actualValue != null ? "var(--ink)" : "var(--ink-mute)" }}>
                              {ach?.actualValue ?? "—"}
                            </td>
                            <td style={{ textAlign: "right", padding: "10px 10px" }}>
                              <span className="pill" style={{
                                background: ach?.status === "COMPLETED" ? "var(--ok-soft)" : ach?.status === "IN_PROGRESS" ? "var(--warn-soft)" : "var(--bg-elev)",
                                color: ach?.status === "COMPLETED" ? "var(--ok)" : ach?.status === "IN_PROGRESS" ? "var(--warn)" : "var(--ink-mute)",
                              }}>
                                {ach?.status?.replace("_", " ").toLowerCase() ?? "not started"}
                              </span>
                            </td>
                            <td style={{ textAlign: "right", padding: "10px 10px", fontFamily: "var(--font-jetbrains-mono)", fontSize: "13px", fontWeight: 700, color: scoreColor(sc) }}>
                              {scoreLabel(sc)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Existing check-in comments */}
                {existing.length > 0 && (
                  <div>
                    <p style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ink-mute)", fontFamily: "var(--font-jetbrains-mono)", marginBottom: "8px" }}>Previous check-in notes</p>
                    <div className="space-y-2">
                      {existing.map((c, i) => (
                        <div key={i} style={{ background: "var(--bg-elev)", borderRadius: "var(--r-md)", padding: "12px 14px", borderLeft: "3px solid var(--brand)" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                            <Avatar name={c.manager?.name ?? "?"} tone="oklch(0.92 0.10 92)" size={22} />
                            <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink)" }}>{c.manager?.name}</span>
                            <span style={{ fontSize: "11px", color: "var(--ink-mute)" }}>· {quarter}</span>
                          </div>
                          <p style={{ fontSize: "13px", color: "var(--ink-soft)", margin: 0, lineHeight: 1.6 }}>{c.comment}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add check-in comment */}
                <div style={{ background: "var(--bg)", border: "1px solid var(--line)", borderRadius: "var(--r-md)", padding: "14px 16px" }}>
                  <p style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ink-mute)", fontFamily: "var(--font-jetbrains-mono)", marginBottom: "10px" }}>
                    {existing.length > 0 ? "Add another note" : "Add check-in note"}
                  </p>
                  <textarea
                    value={comments[sheet.id] ?? ""}
                    onChange={(e) => setComments((c) => ({ ...c, [sheet.id]: e.target.value }))}
                    rows={3}
                    placeholder={`Document your ${quarter} discussion with ${sheet.employee?.name?.split(" ")[0]}…`}
                    style={{
                      width: "100%", padding: "10px 12px", borderRadius: "var(--r-sm)",
                      border: "1px solid var(--line-strong)", background: "var(--paper)",
                      fontSize: "13.5px", color: "var(--ink)", resize: "vertical",
                      fontFamily: "inherit", outline: "none", lineHeight: 1.6,
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "var(--brand)"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "var(--line-strong)"; }}
                  />
                  <div className="flex items-center gap-2.5 mt-3">
                    <button
                      className="btn-primary"
                      style={{ fontSize: "13px", padding: "8px 16px" }}
                      onClick={() => saveComment(sheet.id)}
                      disabled={saving[sheet.id]}
                    >
                      {saving[sheet.id] ? "Saving…" : "Save note"} <Icon name="check" size={13} />
                    </button>
                    {comments[sheet.id] && (
                      <button className="btn-ghost" style={{ fontSize: 12, padding: "7px 12px" }} onClick={() => setComments((c) => ({ ...c, [sheet.id]: "" }))}>Clear</button>
                    )}
                    <span style={{ fontSize: "11.5px", color: "var(--ink-mute)", marginLeft: "auto" }}>
                      {comments[sheet.id]?.length ?? 0} chars
                    </span>
                  </div>
                </div>
              </div>
            )}
          </Panel>
        );
      })}

      {!loading && sheets.length === 0 && (
        <Panel title="No approved sheets" sub="">
          <div style={{ padding: "40px", textAlign: "center", color: "var(--ink-mute)", fontFamily: "var(--font-jetbrains-mono)", fontSize: "13px" }}>
            No approved goal sheets found for {quarter}.
          </div>
        </Panel>
      )}

      {/* Quarter timeline reference */}
      <Panel title="Quarter timeline" sub={`${QUARTER_LABELS[quarter] ?? quarter} milestones`}>
        <ActivityFeed items={[
          { dot: "ok",      content: <><strong>{quarter} cycle opened</strong> · Goal sheets locked and check-in window activated <span style={{ color: "var(--ink-mute)", fontSize: 11 }}>· Day 1</span></> },
          { dot: "ok",      content: <><strong>Mid-quarter sync</strong> · 1:1s recommended for at-risk reports <span style={{ color: "var(--ink-mute)", fontSize: 11 }}>· Day 45</span></> },
          { dot: "warn",    content: <><strong>Check-in comments due</strong> · Document discussions before cycle closes <span style={{ color: "var(--ink-mute)", fontSize: 11 }}>· Day 75</span></> },
          { dot: "neutral", content: <><strong>Cycle close & score freeze</strong> · Achievements locked for scoring <span style={{ color: "var(--ink-mute)", fontSize: 11 }}>· Day 90</span></> },
        ]} />
      </Panel>
    </div>
  );
}
