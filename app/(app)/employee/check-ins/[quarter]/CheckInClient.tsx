"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Panel, PageHeader, Icon } from "@/components/app/ui";
import { toast } from "sonner";
import type { CyclePhase } from "@prisma/client";

interface Achievement {
  id: string; goalId: string; quarter: string; actualValue: number | null;
  actualDate: string | null; status: string; notes: string | null; computedScore: number | null;
}
interface Goal {
  id: string; title: string; thrustArea: string; uomType: string;
  targetValue: number | null; targetDate: string | null; weightage: number; achievements: Achievement[];
}
interface GoalSheet { id: string; status: string; cycle: { year: number; phase: string }; goals: Goal[] }

const DEMO_GOALS: Goal[] = [
  { id: "dg1", title: "Launch silent-mode firmware v3",   thrustArea: "Engineering", uomType: "TIMELINE",    targetValue: null, targetDate: "2026-06-30", weightage: 20, achievements: [{ id: "a1", goalId: "dg1", quarter: "Q2", actualValue: null, actualDate: "2026-06-21", status: "COMPLETED", notes: "Shipped on Jun 21 — 9 days ahead.", computedScore: 1.0 }] },
  { id: "dg2", title: "Reduce field RMA rate to < 0.8%",  thrustArea: "Quality",     uomType: "NUMERIC_MIN", targetValue: 0.8,  targetDate: null,          weightage: 18, achievements: [{ id: "a2", goalId: "dg2", quarter: "Q2", actualValue: 0.71, actualDate: null, status: "ON_TRACK",  notes: "Renesa-7 line stable at 0.71.",     computedScore: 1.13 }] },
  { id: "dg3", title: "Hire 3 senior FW engineers",       thrustArea: "People",      uomType: "NUMERIC_MIN", targetValue: 3,    targetDate: null,          weightage: 12, achievements: [{ id: "a3", goalId: "dg3", quarter: "Q2", actualValue: 3,    actualDate: null, status: "COMPLETED", notes: "All 3 offers accepted.",           computedScore: 0.98 }] },
  { id: "dg4", title: "Cut BoM cost by 6% (Renesa-7)",   thrustArea: "Operations",  uomType: "NUMERIC_MAX", targetValue: 6,    targetDate: null,          weightage: 14, achievements: [{ id: "a4", goalId: "dg4", quarter: "Q2", actualValue: 4.1,  actualDate: null, status: "ON_TRACK",  notes: "Vendor renegotiation in progress.", computedScore: 0.68 }] },
  { id: "dg5", title: "Publish Q3 product playbook",     thrustArea: "Engineering", uomType: "TIMELINE",    targetValue: null, targetDate: "2026-07-15", weightage: 8,  achievements: [] },
];
const DEMO_SHEET: GoalSheet = { id: "demo-sheet", status: "APPROVED", cycle: { year: 2026, phase: "GOAL_SETTING" }, goals: DEMO_GOALS };

const STATUS_OPTIONS = [
  { value: "NOT_STARTED", label: "Not started" },
  { value: "ON_TRACK",    label: "On track" },
  { value: "COMPLETED",   label: "Completed" },
];
const UOM_LABEL: Record<string, string> = {
  NUMERIC_MIN: "Numeric-min", NUMERIC_MAX: "Numeric-max", TIMELINE: "Timeline", ZERO: "Zero",
};
function scoreColor(score: number) {
  if (score >= 1.0) return "var(--ok)";
  if (score >= 0.7) return "oklch(0.86 0.175 88)";
  return "oklch(0.74 0.16 50)";
}

export function CheckInClient({ isDemo }: { isDemo: boolean }) {
  const params = useParams();
  const quarter = (params.quarter as string).toUpperCase() as CyclePhase;
  const [sheets, setSheets] = useState<GoalSheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch("/api/goals")
      .then((r) => r.json())
      .then((data) => {
        const approved = (Array.isArray(data) ? data : []).filter((s: GoalSheet) => s.status === "APPROVED");
        if (approved.length > 0) {
          setSheets(approved);
        } else if (isDemo) {
          setSheets([DEMO_SHEET]);
        } else {
          setSheets([]);
        }
      })
      .catch(() => setSheets(isDemo ? [DEMO_SHEET] : []))
      .finally(() => setLoading(false));
  }, [isDemo]);

  async function saveAchievement(goalId: string, data: { actualValue?: number; actualDate?: string; status: string; notes?: string }) {
    setSaving((s) => ({ ...s, [goalId]: true }));
    try {
      const res = await fetch(`/api/achievements/${goalId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, quarter }),
      });
      if (res.ok) {
        toast.success("Achievement saved");
        setSheets((prev) => prev.map((sheet) => ({
          ...sheet,
          goals: sheet.goals.map((g) => g.id === goalId ? {
            ...g, achievements: [{
              id: Date.now().toString(), goalId, quarter, status: data.status,
              actualValue: data.actualValue ?? null, actualDate: data.actualDate ?? null,
              notes: data.notes ?? null, computedScore: null,
            }],
          } : g),
        })));
      } else {
        toast.error("Failed to save");
      }
    } catch { toast.error("Failed to save"); }
    setSaving((s) => ({ ...s, [goalId]: false }));
  }

  return (
    <div className="space-y-5 fade-up">
      <PageHeader
        eyebrow={`FY 2026 · check-in`}
        title={`${quarter} actuals.`}
        lede="Log your actuals for this quarter. Scores are computed instantly — no manual calculation."
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
            Your goal sheet needs to be approved by your manager before you can log actuals.
          </div>
        </div>
      ) : (
        sheets.map((sheet) => (
          <Panel key={sheet.id} title={`${sheet.cycle.year} · ${sheet.cycle.phase.replace("_", " ")}`} sub={`${sheet.goals.length} goals · ${quarter} check-in`}>
            <div>
              {sheet.goals.map((goal, i) => {
                const existing = goal.achievements.find((a) => a.quarter === quarter);
                return (
                  <GoalCheckInRow key={goal.id} goal={goal} existing={existing} saving={!!saving[goal.id]}
                    isLast={i === sheet.goals.length - 1} quarter={quarter} onSave={(data) => saveAchievement(goal.id, data)} />
                );
              })}
            </div>
          </Panel>
        ))
      )}
    </div>
  );
}

function GoalCheckInRow({ goal, existing, saving, isLast, quarter, onSave }: {
  goal: Goal; existing?: Achievement; saving: boolean; isLast: boolean; quarter: string;
  onSave: (data: { actualValue?: number; actualDate?: string; status: string; notes?: string }) => void;
}) {
  const [actualValue, setActualValue] = useState(existing?.actualValue?.toString() ?? "");
  const [actualDate, setActualDate] = useState(existing?.actualDate?.split("T")[0] ?? "");
  const [status, setStatus] = useState(existing?.status ?? "NOT_STARTED");
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [expanded, setExpanded] = useState(false);
  const score = existing?.computedScore;

  return (
    <div style={{ borderBottom: isLast ? "none" : "1px solid oklch(0.92 0.012 88)", padding: "18px 0" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 500, fontSize: "14px" }}>{goal.title}</div>
          <div style={{ display: "flex", gap: "8px", marginTop: "5px", flexWrap: "wrap" }}>
            <span className="pill" style={{ background: "oklch(0.96 0.01 80)", color: "var(--ink-mute)" }}>{goal.weightage}%</span>
            <span className="pill" style={{ background: "oklch(0.95 0.04 90)", color: "oklch(0.50 0.08 80)" }}>{UOM_LABEL[goal.uomType] ?? goal.uomType}</span>
            {goal.targetValue != null && <span className="pill" style={{ background: "oklch(0.95 0.01 80)", color: "var(--ink-mute)" }}>target {goal.targetValue}</span>}
            {goal.targetDate && <span className="pill" style={{ background: "oklch(0.95 0.01 80)", color: "var(--ink-mute)" }}>by {new Date(goal.targetDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>}
          </div>
          {existing?.notes && <div style={{ marginTop: "6px", fontSize: "12.5px", color: "oklch(0.50 0.02 80)", fontStyle: "italic" }}>"{existing.notes}"</div>}
        </div>
        {score != null ? (
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ fontFamily: "var(--font-serif)", fontSize: "36px", lineHeight: 1, color: scoreColor(score) }}>{score.toFixed(2)}</div>
            <div className="font-mono text-xs" style={{ color: "var(--ink-mute)", marginTop: "2px" }}>/ 1.5×</div>
          </div>
        ) : (
          <span className="pill" style={{ background: "oklch(0.95 0.01 80)", color: "var(--ink-mute)", flexShrink: 0 }}>not scored</span>
        )}
      </div>
      {score != null && (
        <div style={{ height: "4px", background: "oklch(0.94 0.01 90)", borderRadius: "999px", overflow: "hidden", marginTop: "10px" }}>
          <div style={{ height: "100%", width: `${Math.min(score / 1.5, 1) * 100}%`, background: scoreColor(score), borderRadius: "999px", transition: "width 0.7s cubic-bezier(.2,.7,.2,1)" }} />
        </div>
      )}
      <button onClick={() => setExpanded((v) => !v)} className="btn-ghost" style={{ marginTop: "10px", fontSize: "12.5px", padding: "4px 10px" }}>
        {expanded ? "Hide form" : existing ? "Edit actual →" : `Log ${quarter} actual →`}
      </button>
      {expanded && (
        <div style={{ marginTop: "16px", padding: "18px", background: "oklch(0.97 0.012 90)", borderRadius: "14px", border: "1px solid var(--line)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "14px" }}>
            {(goal.uomType === "NUMERIC_MIN" || goal.uomType === "NUMERIC_MAX" || goal.uomType === "ZERO") && (
              <label className="block">
                <span style={{ fontSize: "11px", fontFamily: "var(--font-jetbrains-mono)", color: "var(--ink-mute)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{goal.uomType === "ZERO" ? "Incidents / count" : "Actual value"}</span>
                <input type="number" value={actualValue} onChange={(e) => setActualValue(e.target.value)}
                  style={{ marginTop: "6px", width: "100%", padding: "9px 12px", borderRadius: "10px", border: "1px solid var(--line-strong)", background: "var(--surface-card)", fontSize: "13.5px", color: "var(--ink)", outline: "none", display: "block" }} />
              </label>
            )}
            {goal.uomType === "TIMELINE" && (
              <label className="block">
                <span style={{ fontSize: "11px", fontFamily: "var(--font-jetbrains-mono)", color: "var(--ink-mute)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Completion date</span>
                <input type="date" value={actualDate} onChange={(e) => setActualDate(e.target.value)}
                  style={{ marginTop: "6px", width: "100%", padding: "9px 12px", borderRadius: "10px", border: "1px solid var(--line-strong)", background: "var(--surface-card)", fontSize: "13.5px", color: "var(--ink)", outline: "none", display: "block" }} />
              </label>
            )}
            <label className="block">
              <span style={{ fontSize: "11px", fontFamily: "var(--font-jetbrains-mono)", color: "var(--ink-mute)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Status</span>
              <select value={status} onChange={(e) => setStatus(e.target.value)}
                style={{ marginTop: "6px", width: "100%", padding: "9px 12px", borderRadius: "10px", border: "1px solid var(--line-strong)", background: "var(--surface-card)", fontSize: "13.5px", color: "var(--ink)", outline: "none", display: "block" }}>
                {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </label>
          </div>
          <label className="block" style={{ marginTop: "14px" }}>
            <span style={{ fontSize: "11px", fontFamily: "var(--font-jetbrains-mono)", color: "var(--ink-mute)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Notes</span>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
              style={{ marginTop: "6px", width: "100%", padding: "9px 12px", borderRadius: "10px", border: "1px solid var(--line-strong)", background: "var(--surface-card)", fontSize: "13.5px", color: "var(--ink)", outline: "none", display: "block", resize: "vertical", fontFamily: "inherit" }} />
          </label>
          <button className="btn-primary" style={{ marginTop: "14px" }} disabled={saving}
            onClick={() => onSave({ actualValue: actualValue ? parseFloat(actualValue) : undefined, actualDate: actualDate || undefined, status, notes: notes || undefined })}>
            {saving ? "Saving…" : "Save actual"}
          </button>
        </div>
      )}
    </div>
  );
}
export default CheckInClient;
