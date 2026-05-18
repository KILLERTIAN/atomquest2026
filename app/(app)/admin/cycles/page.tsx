"use client";

import { useEffect, useState } from "react";
import { Panel, PageHeader, Icon, SectionLabel } from "@/components/app/ui";
import { toast } from "sonner";

interface Cycle {
  id: string;
  year: number;
  phase: string;
  openDate: string;
  closeDate: string;
  isActive: boolean;
  _count: { goalSheets: number };
}

const PHASE_LABEL: Record<string, string> = {
  GOAL_SETTING: "Goal Setting",
  Q1: "Q1 Check-in",
  Q2: "Q2 Check-in",
  Q3: "Q3 Check-in",
  Q4: "Q4 / Annual",
};

const DEMO_CYCLES: Cycle[] = [
  { id: "demo-1", year: 2026, phase: "GOAL_SETTING", openDate: "2026-05-01", closeDate: "2026-06-30", isActive: true, _count: { goalSheets: 42 } },
  { id: "demo-2", year: 2025, phase: "Q4", openDate: "2026-01-01", closeDate: "2026-03-31", isActive: false, _count: { goalSheets: 98 } },
  { id: "demo-3", year: 2025, phase: "Q3", openDate: "2025-10-01", closeDate: "2025-12-31", isActive: false, _count: { goalSheets: 95 } },
  { id: "demo-4", year: 2025, phase: "Q2", openDate: "2025-07-01", closeDate: "2025-09-30", isActive: false, _count: { goalSheets: 91 } },
  { id: "demo-5", year: 2025, phase: "Q1", openDate: "2025-04-01", closeDate: "2025-06-30", isActive: false, _count: { goalSheets: 88 } },
  { id: "demo-6", year: 2025, phase: "GOAL_SETTING", openDate: "2025-05-01", closeDate: "2025-06-30", isActive: false, _count: { goalSheets: 103 } },
];

export default function CyclesPage() {
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ year: new Date().getFullYear(), phase: "GOAL_SETTING", openDate: "", closeDate: "", isActive: false });
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      const r = await fetch("/api/cycles");
      if (r.ok) {
        const data = await r.json();
        setCycles(Array.isArray(data) && data.length > 0 ? data : DEMO_CYCLES);
      } else {
        setCycles(DEMO_CYCLES);
      }
    } catch {
      setCycles(DEMO_CYCLES);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleCreate() {
    setSaving(true);
    try {
      const res = await fetch("/api/cycles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success("Cycle created");
        setShowForm(false);
        await load();
      } else {
        toast.error("Failed to create cycle");
      }
    } finally {
      setSaving(false);
    }
  }

  const active = cycles.filter((c) => c.isActive);

  return (
    <div className="space-y-5 fade-up">
      <PageHeader
        eyebrow="admin · cycles"
        title="Goal cycles."
        lede={`${cycles.length} cycles · ${active.length} active · automation handles reminders and escalations`}
        actions={
          <button className="btn-primary" onClick={() => setShowForm((v) => !v)}>
            <Icon name="plus" size={14} /> New cycle
          </button>
        }
      />

      {showForm && (
        <Panel title="Create new cycle" sub="Set dates and phase for the new goal cycle">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "18px" }}>
            <label className="field-group">
              <span className="field-label">Year</span>
              <input type="number" className="field-input" value={form.year} onChange={(e) => setForm((p) => ({ ...p, year: parseInt(e.target.value) }))} />
            </label>
            <label className="field-group">
              <span className="field-label">Phase</span>
              <select className="field-input" value={form.phase} onChange={(e) => setForm((p) => ({ ...p, phase: e.target.value }))}>
                {Object.entries(PHASE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </label>
            <label className="field-group">
              <span className="field-label">Open date</span>
              <input type="date" className="field-input" value={form.openDate} onChange={(e) => setForm((p) => ({ ...p, openDate: e.target.value }))} />
            </label>
            <label className="field-group">
              <span className="field-label">Close date</span>
              <input type="date" className="field-input" value={form.closeDate} onChange={(e) => setForm((p) => ({ ...p, closeDate: e.target.value }))} />
            </label>
          </div>
          <label className="flex items-center gap-2.5 mt-4 cursor-pointer" style={{ fontSize: "13.5px" }}>
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))} style={{ width: "16px", height: "16px", accentColor: "oklch(0.86 0.175 88)" }} />
            Set as active cycle
          </label>
          <div className="flex gap-2.5 mt-5">
            <button className="btn-primary" onClick={handleCreate} disabled={saving}>
              {saving ? "Creating…" : "Create cycle"}
            </button>
            <button className="btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </Panel>
      )}

      {active.length > 0 && (
        <section>
          <SectionLabel>Active</SectionLabel>
          <div className="rail">
            {active.map((c, i) => (
              <CycleCard key={c.id} cycle={c} index={i} />
            ))}
          </div>
        </section>
      )}

      <Panel title="All cycles" sub="Full history" noPadding>
        <table className="audit-tbl">
          <thead>
            <tr><th>Year</th><th>Phase</th><th>Open</th><th>Close</th><th>Status</th><th>Sheets</th></tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={6} style={{ textAlign: "center", padding: "48px", color: "var(--ink-mute)", fontFamily: "var(--font-jetbrains-mono)", fontSize: "13px" }}>Loading…</td></tr>
            )}
            {!loading && cycles.map((c) => (
              <tr key={c.id}>
                <td className="font-mono text-sm">{c.year}</td>
                <td className="text-sm">{PHASE_LABEL[c.phase] ?? c.phase}</td>
                <td className="font-mono text-xs" style={{ color: "var(--ink-mute)" }}>{new Date(c.openDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</td>
                <td className="font-mono text-xs" style={{ color: "var(--ink-mute)" }}>{new Date(c.closeDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</td>
                <td>
                  {c.isActive ? (
                    <span className="pill" style={{ background: "oklch(0.95 0.06 150)", color: "oklch(0.40 0.12 150)" }}>active</span>
                  ) : (
                    <span className="pill" style={{ background: "oklch(0.95 0.01 80)", color: "var(--ink-mute)" }}>completed</span>
                  )}
                </td>
                <td className="font-mono text-sm">{c._count.goalSheets}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      <style>{`
        .field-group { display: flex; flex-direction: column; gap: 6px; }
        .field-label { font-size: 12px; font-family: var(--font-jetbrains-mono); color: var(--ink-mute); text-transform: uppercase; letter-spacing: 0.08em; }
        .field-input { padding: 9px 12px; border-radius: 10px; border: 1px solid var(--line-strong); background: var(--bg); font-size: 13.5px; color: var(--ink); width: 100%; outline: none; transition: border-color .2s; }
        .field-input:focus { border-color: var(--brand); }
        select.field-input { appearance: auto; }
      `}</style>
    </div>
  );
}

function CycleCard({ cycle, index }: { cycle: Cycle; index: number }) {
  const now = new Date();
  const open = new Date(cycle.openDate);
  const close = new Date(cycle.closeDate);
  const total = close.getTime() - open.getTime();
  const elapsed = now.getTime() - open.getTime();
  const pct = Math.min(Math.max(elapsed / total, 0), 1);

  return (
    <div className="rail-step now">
      <span className="rs-num font-mono">0{index + 1}</span>
      <span className="rs-name">{PHASE_LABEL[cycle.phase] ?? cycle.phase}</span>
      <span className="rs-date font-mono text-xs">{cycle.year}</span>
      <div className="rs-prog"><div className="rs-prog-fill" style={{ width: `${pct * 100}%` }} /></div>
      <div className="text-xs font-mono mt-2" style={{ color: "var(--ink-mute)" }}>
        {new Date(cycle.openDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} – {new Date(cycle.closeDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
      </div>
    </div>
  );
}
