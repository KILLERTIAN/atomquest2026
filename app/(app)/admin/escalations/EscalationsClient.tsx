"use client";

import { useState } from "react";
import { Panel, ActivityFeed, Icon } from "@/components/app/ui";
import { toast } from "sonner";

type EscRule = { id: string; trigger: string; daysThreshold: number; isActive: boolean; description: string | null };
type EscEvent = {
  id: string; triggeredAt: Date | string; rule: { trigger: string; daysThreshold: number };
  entityId: string; resolvedAt: Date | string | null; resolvedBy: { name: string } | null;
};

const TRIGGER_OPTIONS = ["SUBMISSION", "APPROVAL", "CHECKIN"] as const;

export default function EscalationsClient({
  initialRules,
  events,
  openCount,
}: {
  initialRules: EscRule[];
  events: EscEvent[];
  openCount: number;
}) {
  const [rules, setRules] = useState<EscRule[]>(initialRules);
  const [showForm, setShowForm] = useState(false);
  const [cronRunning, setCronRunning] = useState(false);
  const [form, setForm] = useState({ trigger: "SUBMISSION" as typeof TRIGGER_OPTIONS[number], daysThreshold: 7, description: "" });
  const [saving, setSaving] = useState<string | null>(null);

  async function toggleRule(rule: EscRule) {
    setSaving(rule.id);
    try {
      const res = await fetch(`/api/escalation-rules?id=${rule.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !rule.isActive }),
      });
      if (!res.ok) throw new Error(await res.text());
      const updated: EscRule = await res.json();
      setRules((prev) => prev.map((r) => (r.id === rule.id ? updated : r)));
      toast.success(updated.isActive ? "Rule activated" : "Rule paused");
    } catch {
      toast.error("Failed to update rule");
    } finally {
      setSaving(null);
    }
  }

  async function deleteRule(id: string) {
    if (!confirm("Delete this escalation rule?")) return;
    setSaving(id);
    try {
      const res = await fetch(`/api/escalation-rules?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      setRules((prev) => prev.filter((r) => r.id !== id));
      toast.success("Rule deleted");
    } catch {
      toast.error("Failed to delete rule");
    } finally {
      setSaving(null);
    }
  }

  async function createRule(e: React.FormEvent) {
    e.preventDefault();
    setSaving("new");
    try {
      const res = await fetch("/api/escalation-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trigger: form.trigger, daysThreshold: form.daysThreshold, isActive: true, description: form.description || undefined }),
      });
      if (!res.ok) throw new Error(await res.text());
      const created: EscRule = await res.json();
      setRules((prev) => [...prev, created]);
      setShowForm(false);
      setForm({ trigger: "SUBMISSION", daysThreshold: 7, description: "" });
      toast.success("Rule created");
    } catch {
      toast.error("Failed to create rule");
    } finally {
      setSaving(null);
    }
  }

  async function runCron() {
    setCronRunning(true);
    try {
      const res = await fetch("/api/cron/escalation", {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET ?? ""}` },
      });
      if (!res.ok) throw new Error("Cron returned " + res.status);
      toast.success("Cron executed — check events table for new escalations");
    } catch {
      toast.error("Cron failed (check server logs)");
    } finally {
      setCronRunning(false);
    }
  }

  const openEvents = events.filter((e) => !e.resolvedAt);

  return (
    <div className="space-y-5">
      {/* header actions */}
      <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
        <button className="btn-secondary" onClick={() => setShowForm((v) => !v)}>
          <Icon name="plus" size={14} /> New rule
        </button>
        <button className="btn-secondary" onClick={runCron} disabled={cronRunning}>
          <Icon name="cycle" size={14} /> {cronRunning ? "Running…" : "Run cron now"}
        </button>
      </div>

      {/* new rule form */}
      {showForm && (
        <Panel title="New escalation rule" sub="Triggers a notification after N days">
          <form onSubmit={createRule} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div>
                <label className="form-label">Trigger</label>
                <select className="input" value={form.trigger} onChange={(e) => setForm((f) => ({ ...f, trigger: e.target.value as typeof TRIGGER_OPTIONS[number] }))}>
                  {TRIGGER_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Days threshold</label>
                <input className="input" type="number" min={1} max={365} value={form.daysThreshold}
                  onChange={(e) => setForm((f) => ({ ...f, daysThreshold: parseInt(e.target.value, 10) || 1 }))} />
              </div>
            </div>
            <div>
              <label className="form-label">Description (optional)</label>
              <input className="input" type="text" placeholder="E.g. Employee hasn't submitted goals within N days"
                value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button type="submit" className="btn-primary" disabled={saving === "new"}>
                {saving === "new" ? "Saving…" : "Create rule"}
              </button>
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </Panel>
      )}

      {/* rule cards */}
      <div className="stats-row">
        {rules.map((rule) => (
          <div key={rule.id} className="stat-card" style={{ opacity: rule.isActive ? 1 : 0.55, position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
              <span className="pill" style={{
                background: rule.isActive ? "oklch(0.95 0.06 150)" : "oklch(0.95 0.01 80)",
                color: rule.isActive ? "oklch(0.40 0.12 150)" : "var(--ink-mute)",
              }}>{rule.isActive ? "active" : "paused"}</span>
              <span className="font-mono text-xs" style={{ color: "var(--ink-mute)" }}>≥ {rule.daysThreshold}d</span>
            </div>
            <div className="sc-val" style={{ fontSize: "13.5px", lineHeight: 1.3, marginBottom: "8px" }}>
              {rule.description ?? rule.trigger}
            </div>
            <div className="sc-hint font-mono" style={{ marginBottom: "12px" }}>trigger: {rule.trigger.toLowerCase()}</div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                className="btn-secondary"
                style={{ fontSize: "11px", padding: "4px 10px" }}
                onClick={() => toggleRule(rule)}
                disabled={saving === rule.id}
              >
                {saving === rule.id ? "…" : rule.isActive ? "Pause" : "Activate"}
              </button>
              <button
                className="btn-secondary"
                style={{ fontSize: "11px", padding: "4px 10px", color: "oklch(0.55 0.18 25)" }}
                onClick={() => deleteRule(rule.id)}
                disabled={saving === rule.id}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {rules.length === 0 && (
          <div style={{ padding: "32px", color: "var(--ink-mute)", fontFamily: "var(--font-jetbrains-mono)", fontSize: "13px" }}>
            No rules configured. Click "New rule" to add one.
          </div>
        )}
      </div>

      {/* open events */}
      {openEvents.length > 0 && (
        <Panel title={`Open events · ${openEvents.length}`} sub="Escalations not yet resolved">
          <ActivityFeed items={openEvents.map((ev) => ({
            dot: "warn" as const,
            content: (
              <span>
                <strong>{ev.rule.trigger.replace(/_/g, " ").toLowerCase()}</strong> escalation
                {" · "}<span className="font-mono text-xs">{ev.entityId.slice(0, 12)}…</span>
                {" · "}<span style={{ color: "var(--ink-mute)", fontSize: "11px" }}>
                  {new Date(ev.triggeredAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </span>
              </span>
            ),
          }))} />
        </Panel>
      )}

      {/* all events table */}
      <Panel title="Recent escalation events" sub="Last 100 escalations" noPadding>
        <table className="audit-tbl">
          <thead>
            <tr><th>When</th><th>Rule</th><th>Entity</th><th>Status</th><th>Resolved by</th></tr>
          </thead>
          <tbody>
            {events.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: "center", padding: "48px", color: "var(--ink-mute)", fontFamily: "var(--font-jetbrains-mono)", fontSize: "13px" }}>No escalation events yet</td></tr>
            )}
            {events.map((ev) => (
              <tr key={ev.id}>
                <td className="font-mono text-xs" style={{ color: "var(--ink-mute)" }}>
                  {new Date(ev.triggeredAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </td>
                <td className="text-sm">{ev.rule.trigger} &gt; {ev.rule.daysThreshold}d</td>
                <td className="font-mono text-xs" style={{ color: "var(--ink-mute)" }}>{ev.entityId.slice(0, 10)}…</td>
                <td>
                  {ev.resolvedAt ? (
                    <span className="pill" style={{ background: "oklch(0.95 0.06 150)", color: "oklch(0.40 0.12 150)" }}>resolved</span>
                  ) : (
                    <span className="pill" style={{ background: "oklch(0.95 0.06 50)", color: "oklch(0.45 0.13 50)" }}>open</span>
                  )}
                </td>
                <td className="text-sm" style={{ color: "var(--ink-mute)" }}>{ev.resolvedBy?.name ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
