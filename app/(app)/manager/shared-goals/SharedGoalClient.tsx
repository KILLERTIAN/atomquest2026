"use client";

import { useState } from "react";
import { Panel, Icon } from "@/components/app/ui";
import { toast } from "sonner";

const THRUST_AREAS = [
  "Engineering", "Quality", "Operations", "Product", "People",
  "Finance", "Sales", "Marketing", "Customer Success", "Strategy",
];

const UOM_OPTIONS = [
  { value: "NUMERIC_MIN", label: "Numeric (higher = better)", desc: "e.g. revenue, units shipped" },
  { value: "NUMERIC_MAX", label: "Numeric (lower = better)", desc: "e.g. defect rate, downtime" },
  { value: "TIMELINE",    label: "Timeline",                  desc: "Completed before target date?" },
  { value: "ZERO",        label: "Zero-based",                desc: "Target is zero (no incidents, no bugs)" },
];

interface Employee { id: string; name: string; email: string }
interface Cycle    { id: string; year: number; phase: string }

interface Props {
  employees: Employee[];
  cycles: Cycle[];
}

export function SharedGoalClient({ employees, cycles }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [cycleId, setCycleId] = useState(cycles[0]?.id ?? "");
  const [thrustArea, setThrustArea] = useState(THRUST_AREAS[0]);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [uomType, setUomType] = useState("NUMERIC_MIN");
  const [targetValue, setTargetValue] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [weightage, setWeightage] = useState("20");
  const [loading, setLoading] = useState(false);

  function toggleAll() {
    if (selected.size === employees.length) setSelected(new Set());
    else setSelected(new Set(employees.map((e) => e.id)));
  }

  function toggle(id: string) {
    setSelected((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (selected.size === 0) { toast.error("Select at least one employee"); return; }
    const w = parseInt(weightage);
    if (isNaN(w) || w < 10 || w > 100) { toast.error("Weightage must be 10–100"); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/shared-goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeIds: Array.from(selected),
          cycleId,
          thrustArea,
          title,
          description: desc || undefined,
          uomType,
          targetValue: targetValue ? parseFloat(targetValue) : null,
          targetDate: targetDate || null,
          weightage: w,
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed"); return; }
      toast.success(`Shared goal pushed to ${selected.size} employee${selected.size !== 1 ? "s" : ""}`);
      setTitle(""); setDesc(""); setTargetValue(""); setTargetDate("");
      setSelected(new Set());
    } finally {
      setLoading(false);
    }
  }

  const needsTarget = uomType === "NUMERIC_MIN" || uomType === "NUMERIC_MAX";
  const needsDate   = uomType === "TIMELINE";

  return (
    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <Panel title="Recipients" sub="Select which team members receive this shared goal">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          <span style={{ fontSize: "12px", color: "var(--ink-mute)" }}>
            {selected.size} of {employees.length} selected
          </span>
          <button type="button" className="btn-ghost" style={{ fontSize: "11px", padding: "4px 10px" }} onClick={toggleAll}>
            {selected.size === employees.length ? "Deselect all" : "Select all"}
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {employees.map((emp) => (
            <label key={emp.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "8px", border: `1px solid ${selected.has(emp.id) ? "var(--brand)" : "var(--line)"}`, background: selected.has(emp.id) ? "var(--brand-soft)" : "var(--bg-elev)", cursor: "pointer", transition: "all 0.15s" }}>
              <input type="checkbox" checked={selected.has(emp.id)} onChange={() => toggle(emp.id)} style={{ accentColor: "var(--brand-deep)" }} />
              <div>
                <div style={{ fontSize: "13.5px", fontWeight: 500 }}>{emp.name}</div>
                <div style={{ fontSize: "11px", color: "var(--ink-mute)", fontFamily: "var(--font-jetbrains-mono)" }}>{emp.email}</div>
              </div>
            </label>
          ))}
          {employees.length === 0 && (
            <div style={{ textAlign: "center", padding: "24px", color: "var(--ink-mute)", fontSize: "13px" }}>
              No direct reports found
            </div>
          )}
        </div>
      </Panel>

      <Panel title="Goal details" sub="These fields are read-only for recipients; only weightage can be adjusted">
        <div className="setting-fields">
          <label>
            <span className="setting-field-label">CYCLE</span>
            <select value={cycleId} onChange={(e) => setCycleId(e.target.value)} required>
              {cycles.map((c) => (
                <option key={c.id} value={c.id}>{c.year} — {c.phase.replace("_", " ")}</option>
              ))}
            </select>
          </label>

          <label>
            <span className="setting-field-label">THRUST AREA</span>
            <select value={thrustArea} onChange={(e) => setThrustArea(e.target.value)}>
              {THRUST_AREAS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>

          <label>
            <span className="setting-field-label">GOAL TITLE</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Achieve 95% on-time delivery" required />
          </label>

          <label>
            <span className="setting-field-label">DESCRIPTION (OPTIONAL)</span>
            <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Additional context for this goal" />
          </label>

          <label>
            <span className="setting-field-label">UNIT OF MEASUREMENT</span>
            <select value={uomType} onChange={(e) => setUomType(e.target.value)}>
              {UOM_OPTIONS.map((u) => (
                <option key={u.value} value={u.value}>{u.label} — {u.desc}</option>
              ))}
            </select>
          </label>

          {needsTarget && (
            <label>
              <span className="setting-field-label">TARGET VALUE</span>
              <input type="number" value={targetValue} onChange={(e) => setTargetValue(e.target.value)} placeholder="e.g. 95" step="any" />
            </label>
          )}

          {needsDate && (
            <label>
              <span className="setting-field-label">TARGET DATE</span>
              <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
            </label>
          )}

          <label>
            <span className="setting-field-label">DEFAULT WEIGHTAGE (%)</span>
            <input type="number" value={weightage} onChange={(e) => setWeightage(e.target.value)} min={10} max={100} step={5} required />
          </label>
        </div>
      </Panel>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
        <span style={{ fontSize: "12px", color: "var(--ink-mute)", alignSelf: "center" }}>
          Goal will be added to each recipient&apos;s active sheet (created if needed)
        </span>
        <button type="submit" className="btn-primary" disabled={loading || selected.size === 0}>
          <Icon name="plus" size={14} /> {loading ? "Pushing…" : `Push to ${selected.size || "…"} employee${selected.size !== 1 ? "s" : ""}`}
        </button>
      </div>
    </form>
  );
}
