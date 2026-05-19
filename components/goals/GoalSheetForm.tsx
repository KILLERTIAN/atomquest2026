"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { GoalCycle } from "@prisma/client";
import { WeightBar } from "@/components/app/ui";

let _keyCounter = 0;
function genKey() { return `goal-${++_keyCounter}`; }

const THRUST_AREAS = [
  "Revenue Growth", "Cost Optimisation", "Customer Satisfaction",
  "People Development", "Innovation", "Operational Excellence", "Safety & Compliance",
];

const UOM_LABELS: Record<string, string> = {
  NUMERIC_MIN: "Numeric — Higher is better",
  NUMERIC_MAX: "Numeric — Lower is better",
  TIMELINE:    "Timeline — Hit the deadline",
  ZERO:        "Zero-based — Minimise to zero",
};

interface GoalFormState {
  _key: string;
  id?: string; isShared?: boolean;
  thrustArea: string; title: string; description: string;
  uomType: string; targetValue: string; targetDate: string; weightage: string;
}

const empty = (): GoalFormState => ({
  _key: genKey(),
  thrustArea: "", title: "", description: "", uomType: "NUMERIC_MIN",
  targetValue: "", targetDate: "", weightage: "",
});

interface Props {
  cycles: GoalCycle[];
  existingSheet?: { id: string; cycleId: string; goals: { id?: string; isShared?: boolean; thrustArea: string; title: string; description: string | null; uomType: string; targetValue: number | null; targetDate: Date | string | null; weightage: number; }[]; } | null;
}

const label = (text: string) => (
  <div style={{ fontSize: "11px", fontFamily: "var(--font-jetbrains-mono)", textTransform: "uppercase", letterSpacing: "0.07em", color: "oklch(0.58 0.018 80)", marginBottom: "6px" }}>{text}</div>
);

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 14px", background: "#fff",
  border: "1px solid oklch(0.90 0.015 88)", borderRadius: "10px",
  fontSize: "14px", color: "oklch(0.18 0.018 75)", outline: "none",
  transition: "border-color .2s, box-shadow .2s", boxSizing: "border-box",
};

function Field({ lbl, children }: { lbl: string; children: React.ReactNode }) {
  return <div>{label(lbl)}{children}</div>;
}

function ThemedSelect({ value, onChange, options, placeholder }: {
  value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[]; placeholder?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{ ...inputStyle, cursor: "pointer", appearance: "none",
        backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'><polyline points='6 9 12 15 18 9'/></svg>")`,
        backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center",
        paddingRight: "36px",
      }}
    >
      {placeholder && <option value="" disabled>{placeholder}</option>}
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

export function GoalSheetForm({ cycles, existingSheet }: Props) {
  const router = useRouter();
  const [cycleId, setCycleId] = useState(existingSheet?.cycleId ?? cycles[0]?.id ?? "");
  const [goals, setGoals] = useState<GoalFormState[]>(
    existingSheet?.goals?.map((g) => ({
      _key: g.id ?? genKey(),
      id: g.id, isShared: g.isShared ?? false,
      thrustArea: g.thrustArea, title: g.title,
      description: g.description ?? "", uomType: g.uomType,
      targetValue: String(g.targetValue ?? ""),
      targetDate: g.targetDate
        ? (g.targetDate instanceof Date ? g.targetDate.toISOString() : String(g.targetDate)).split("T")[0]
        : "",
      weightage: String(g.weightage),
    })) ?? [empty()]
  );
  const [saving, setSaving] = useState(false);

  const total = goals.reduce((s, g) => s + (parseFloat(g.weightage) || 0), 0);
  const totalOk = Math.abs(total - 100) < 0.01;

  function upd(i: number, f: keyof GoalFormState, v: string) {
    setGoals((p) => p.map((g, idx) => idx === i ? { ...g, [f]: v } : g));
  }

  async function save(submit = false) {
    setSaving(true);
    const payload = {
      cycleId,
      ...(submit ? {} : { isDraft: true }),
      goals: goals.map((g) => ({
        ...(g.id ? { id: g.id } : {}),
        ...(g.isShared ? { isShared: true } : {}),
        thrustArea: g.thrustArea, title: g.title,
        description: g.description || undefined, uomType: g.uomType,
        targetValue: g.uomType !== "ZERO" && g.targetValue ? parseFloat(g.targetValue) : null,
        targetDate: g.targetDate || null,
        weightage: parseFloat(g.weightage) || 0,
      })),
    };
    const url = existingSheet ? `/api/goals/${existingSheet.id}` : "/api/goals";
    const res = await fetch(url, { method: existingSheet ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (!res.ok) {
      const err = await res.json();
      const msg =
        (typeof err?.error === "string" && err.error) ||
        err?.error?.formErrors?.[0] ||
        Object.values(err?.error?.fieldErrors ?? {}).flat()[0] ||
        "Failed to save";
      toast.error(msg as string);
      setSaving(false);
      return;
    }
    const sheet = await res.json();
    if (submit) {
      const sr = await fetch(`/api/goals/${sheet.id}/submit`, { method: "POST" });
      sr.ok ? toast.success("Submitted for approval") : toast.error("Saved but submit failed");
    } else {
      toast.success("Saved as draft");
    }
    router.push("/employee/goals");
    router.refresh();
  }

  const cycleOptions = cycles.map((c) => ({
    value: c.id,
    label: `${c.year} — ${c.phase === "GOAL_SETTING" ? "Goal Setting" : c.phase.replace("_", " ")}`,
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>

      {/* Cycle + weight bar header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "20px", flexWrap: "wrap" }}>
        <div style={{ minWidth: "220px" }}>
          {label("Cycle")}
          <ThemedSelect value={cycleId} onChange={setCycleId} options={cycleOptions} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{
            fontSize: "13px", fontFamily: "var(--font-jetbrains-mono)", fontWeight: 600,
            color: totalOk ? "oklch(0.52 0.14 142)" : total > 100 ? "oklch(0.55 0.18 28)" : "oklch(0.60 0.14 65)",
          }}>
            {total.toFixed(0)}% / 100%
          </span>
          <button
            onClick={() => goals.length < 8 && setGoals((p) => [...p, empty()])}
            disabled={goals.length >= 8}
            style={{ padding: "8px 16px", borderRadius: "99px", border: "1px solid oklch(0.86 0.175 88)", background: "oklch(0.96 0.08 90)", fontSize: "12.5px", fontWeight: 600, color: "oklch(0.45 0.12 70)", cursor: goals.length >= 8 ? "not-allowed" : "pointer", opacity: goals.length >= 8 ? 0.5 : 1, fontFamily: "inherit" }}
          >
            + Add goal ({goals.length}/8)
          </button>
        </div>
      </div>

      {/* Weight distribution bar */}
      {goals.some((g) => parseFloat(g.weightage) > 0) && (
        <WeightBar goals={goals.map((g) => ({ weight: parseFloat(g.weightage) || 0, title: g.title || `Goal ${goals.indexOf(g) + 1}` }))} />
      )}

      {/* Goal cards */}
      {goals.map((goal, i) => (
        <div key={goal._key} style={{ background: "#fff", border: "1px solid oklch(0.90 0.015 88)", borderRadius: "16px", overflow: "hidden" }}>

          {/* Card header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px 14px", borderBottom: "1px solid oklch(0.94 0.01 88)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "26px", height: "26px", borderRadius: "8px", background: "oklch(0.136 0.022 72)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: "11px", color: "#fdfaf2", fontWeight: 700 }}>{String(i + 1).padStart(2, "0")}</span>
              </div>
              <span style={{ fontWeight: 600, fontSize: "14px" }}>Goal {i + 1}</span>
              {goal.title && <span style={{ fontSize: "12px", color: "var(--ink-mute)", marginLeft: "2px" }}>· {goal.title.slice(0, 40)}{goal.title.length > 40 ? "…" : ""}</span>}
              {goal.isShared && (
                <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 7px", borderRadius: "99px", background: "oklch(0.93 0.06 240)", color: "oklch(0.35 0.10 240)", fontFamily: "var(--font-jetbrains-mono)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  shared · weightage only
                </span>
              )}
            </div>
            {goals.length > 1 && !goal.isShared && (
              <button onClick={() => setGoals((p) => p.filter((_, idx) => idx !== i))}
                style={{ fontSize: "12px", color: "oklch(0.55 0.14 28)", border: "none", background: "none", cursor: "pointer", padding: "4px 8px", borderRadius: "6px", fontFamily: "inherit" }}>
                Remove
              </button>
            )}
          </div>

          {/* Card body */}
          <div style={{ padding: "20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>

            <Field lbl="Thrust Area *">
              <ThemedSelect value={goal.thrustArea} onChange={(v) => !goal.isShared && upd(i, "thrustArea", v)}
                options={THRUST_AREAS.map((t) => ({ value: t, label: t }))} placeholder="Select area…" />
            </Field>

            <Field lbl="Measurement Type *">
              <ThemedSelect value={goal.uomType} onChange={(v) => !goal.isShared && upd(i, "uomType", v)}
                options={Object.entries(UOM_LABELS).map(([v, l]) => ({ value: v, label: l }))} />
            </Field>

            <div style={{ gridColumn: "1 / -1" }}>
              <Field lbl="Goal Title *">
                <input
                  value={goal.title}
                  onChange={(e) => !goal.isShared && upd(i, "title", e.target.value)}
                  placeholder="e.g. Increase quarterly revenue by 15%"
                  readOnly={goal.isShared}
                  style={{ ...inputStyle, ...(goal.isShared ? { background: "oklch(0.97 0.01 88)", color: "var(--ink-mute)", cursor: "default" } : {}) }}
                  onFocus={(e) => { if (!goal.isShared) { e.target.style.borderColor = "oklch(0.72 0.180 75)"; e.target.style.boxShadow = "0 0 0 3px oklch(0.96 0.10 90)"; } }}
                  onBlur={(e) => { e.target.style.borderColor = "oklch(0.90 0.015 88)"; e.target.style.boxShadow = "none"; }}
                />
              </Field>
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <Field lbl="Description">
                <textarea
                  value={goal.description}
                  onChange={(e) => !goal.isShared && upd(i, "description", e.target.value)}
                  placeholder="Context, constraints, definition of success…"
                  readOnly={goal.isShared}
                  rows={2}
                  style={{ ...inputStyle, resize: "vertical", lineHeight: "1.6", ...(goal.isShared ? { background: "oklch(0.97 0.01 88)", color: "var(--ink-mute)", cursor: "default" } : {}) }}
                  onFocus={(e) => { if (!goal.isShared) { e.target.style.borderColor = "oklch(0.72 0.180 75)"; e.target.style.boxShadow = "0 0 0 3px oklch(0.96 0.10 90)"; } }}
                  onBlur={(e) => { e.target.style.borderColor = "oklch(0.90 0.015 88)"; e.target.style.boxShadow = "none"; }}
                />
              </Field>
            </div>

            <Field lbl={goal.uomType === "TIMELINE" ? "Target Date" : "Target Value"}>
              {goal.uomType === "TIMELINE" ? (
                <input type="date" value={goal.targetDate} onChange={(e) => !goal.isShared && upd(i, "targetDate", e.target.value)}
                  readOnly={goal.isShared}
                  style={{ ...inputStyle, ...(goal.isShared ? { background: "oklch(0.97 0.01 88)", color: "var(--ink-mute)", cursor: "default" } : {}) }}
                  onFocus={(e) => { if (!goal.isShared) { e.target.style.borderColor = "oklch(0.72 0.180 75)"; e.target.style.boxShadow = "0 0 0 3px oklch(0.96 0.10 90)"; } }}
                  onBlur={(e) => { e.target.style.borderColor = "oklch(0.90 0.015 88)"; e.target.style.boxShadow = "none"; }} />
              ) : (
                <input type="number" value={goal.targetValue} onChange={(e) => !goal.isShared && upd(i, "targetValue", e.target.value)}
                  placeholder={goal.uomType === "ZERO" ? "Auto — target is 0" : "e.g. 1000000"}
                  disabled={goal.uomType === "ZERO"}
                  readOnly={goal.isShared}
                  style={{ ...inputStyle, opacity: goal.uomType === "ZERO" ? 0.5 : 1, ...(goal.isShared ? { background: "oklch(0.97 0.01 88)", color: "var(--ink-mute)", cursor: "default" } : {}) }}
                  onFocus={(e) => { if (!goal.isShared) { e.target.style.borderColor = "oklch(0.72 0.180 75)"; e.target.style.boxShadow = "0 0 0 3px oklch(0.96 0.10 90)"; } }}
                  onBlur={(e) => { e.target.style.borderColor = "oklch(0.90 0.015 88)"; e.target.style.boxShadow = "none"; }} />
              )}
            </Field>

            <Field lbl="Weightage % *">
              <input type="number" min={10} max={100} value={goal.weightage}
                onChange={(e) => upd(i, "weightage", e.target.value)}
                placeholder="min 10"
                style={inputStyle}
                onFocus={(e) => { e.target.style.borderColor = "oklch(0.72 0.180 75)"; e.target.style.boxShadow = "0 0 0 3px oklch(0.96 0.10 90)"; }}
                onBlur={(e) => { e.target.style.borderColor = "oklch(0.90 0.015 88)"; e.target.style.boxShadow = "none"; }} />
            </Field>

          </div>
        </div>
      ))}

      {/* Actions */}
      <div style={{ display: "flex", gap: "10px", paddingTop: "4px" }}>
        <button onClick={() => save(false)} disabled={saving}
          style={{ padding: "12px 24px", borderRadius: "99px", border: "1px solid oklch(0.82 0.020 85)", background: "#fff", fontSize: "14px", fontWeight: 600, color: "oklch(0.18 0.018 75)", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.6 : 1, fontFamily: "inherit", transition: "all 0.2s" }}>
          Save draft
        </button>
        <button onClick={() => save(true)} disabled={saving || !totalOk}
          style={{ padding: "12px 28px", borderRadius: "99px", border: "none", background: totalOk ? "oklch(0.136 0.022 72)" : "oklch(0.75 0.01 80)", fontSize: "14px", fontWeight: 600, color: "#fdfaf2", cursor: (saving || !totalOk) ? "not-allowed" : "pointer", opacity: (saving || !totalOk) ? 0.7 : 1, fontFamily: "inherit", transition: "all 0.2s", boxShadow: totalOk ? "0 8px 20px -8px oklch(0.2 0.02 80 / 0.4)" : "none" }}>
          {saving ? "Saving…" : "Submit for approval →"}
        </button>
        {!totalOk && total > 0 && (
          <span style={{ fontSize: "12px", color: "oklch(0.60 0.14 65)", alignSelf: "center", fontFamily: "var(--font-jetbrains-mono)" }}>
            {total < 100 ? `${(100 - total).toFixed(0)}% left` : `${(total - 100).toFixed(0)}% over`}
          </span>
        )}
      </div>
    </div>
  );
}
