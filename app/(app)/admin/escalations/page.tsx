import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader, Panel, ActivityFeed, Icon } from "@/components/app/ui";

type EscRule = { id: string; trigger: string; daysThreshold: number; isActive: boolean; description: string | null };
type EscEvent = { id: string; triggeredAt: Date; rule: { trigger: string; daysThreshold: number }; entityId: string; resolvedAt: Date | null; resolvedBy: { name: string } | null };

const DEMO_RULES: EscRule[] = [
  { id: "esc-submission", trigger: "SUBMISSION", daysThreshold: 7, isActive: true, description: "Employee hasn't submitted goals within 7 days of cycle open" },
  { id: "esc-approval",   trigger: "APPROVAL",   daysThreshold: 5, isActive: true, description: "Manager hasn't approved goals within 5 days of submission" },
  { id: "esc-checkin",    trigger: "CHECK_IN",    daysThreshold: 3, isActive: true, description: "Employee hasn't logged Q actuals within 3 days of window open" },
  { id: "esc-mgr-resp",   trigger: "MANAGER_RESPONSE", daysThreshold: 2, isActive: false, description: "Manager hasn't responded to return within 2 days" },
];

const DEMO_EVENTS: EscEvent[] = [
  { id: "ev-1", triggeredAt: new Date("2026-05-16T06:10:00"), rule: { trigger: "SUBMISSION", daysThreshold: 7 }, entityId: "sheet-hiren-q2", resolvedAt: null, resolvedBy: null },
  { id: "ev-2", triggeredAt: new Date("2026-05-15T08:00:00"), rule: { trigger: "APPROVAL",   daysThreshold: 5 }, entityId: "sheet-karan-q2", resolvedAt: new Date("2026-05-15T12:30:00"), resolvedBy: { name: "Sarah Manager" } },
  { id: "ev-3", triggeredAt: new Date("2026-05-14T08:00:00"), rule: { trigger: "SUBMISSION", daysThreshold: 7 }, entityId: "sheet-mira-q2",  resolvedAt: new Date("2026-05-14T16:00:00"), resolvedBy: { name: "Riya Menon" } },
  { id: "ev-4", triggeredAt: new Date("2026-05-13T08:00:00"), rule: { trigger: "APPROVAL",   daysThreshold: 5 }, entityId: "sheet-sahil-q2", resolvedAt: null, resolvedBy: null },
  { id: "ev-5", triggeredAt: new Date("2026-05-12T08:00:00"), rule: { trigger: "CHECK_IN",   daysThreshold: 3 }, entityId: "sheet-devika-q2", resolvedAt: new Date("2026-05-12T11:20:00"), resolvedBy: { name: "Devika Pillai" } },
];

export default async function EscalationsPage() {
  const session = await auth();
  if (!session) return null;

  let rules: EscRule[] = DEMO_RULES;
  let events: EscEvent[] = DEMO_EVENTS;
  try {
    const [dbRules, dbEvents] = await Promise.all([
      db.escalationRule.findMany({ orderBy: { trigger: "asc" } }),
      db.escalationEvent.findMany({
        include: { rule: true, resolvedBy: { select: { name: true } } },
        orderBy: { triggeredAt: "desc" },
        take: 100,
      }),
    ]);
    if (dbRules.length > 0) rules = dbRules.map((r) => ({ ...r, trigger: r.trigger as string }));
    if (dbEvents.length > 0) events = dbEvents.map((e) => ({
      id: e.id, triggeredAt: e.triggeredAt, entityId: e.entityId,
      resolvedAt: e.resolvedAt, resolvedBy: e.resolvedBy,
      rule: { trigger: e.rule.trigger as string, daysThreshold: e.rule.daysThreshold },
    }));
  } catch {}

  const openEvents = events.filter((e) => !e.resolvedAt);

  return (
    <div className="space-y-5 fade-up">
      <PageHeader
        eyebrow="admin · escalations"
        title="Escalation rules."
        lede={`${rules.filter((r) => r.isActive).length} active rules · ${openEvents.length} open event${openEvents.length !== 1 ? "s" : ""} · daily cron runs at 08:00 UTC`}
        actions={
          <button className="btn-secondary">
            <Icon name="cycle" size={14} /> Run cron now
          </button>
        }
      />

      {/* Rule cards */}
      <div className="stats-row">
        {rules.map((rule, i) => (
          <div key={rule.id} className="stat-card" style={{ opacity: rule.isActive ? 1 : 0.5 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
              <span className="pill" style={{
                background: rule.isActive ? "oklch(0.95 0.06 150)" : "oklch(0.95 0.01 80)",
                color: rule.isActive ? "oklch(0.40 0.12 150)" : "var(--ink-mute)",
              }}>{rule.isActive ? "active" : "paused"}</span>
              <span className="font-mono text-xs" style={{ color: "var(--ink-mute)" }}>≥ {rule.daysThreshold}d</span>
            </div>
            <div className="sc-val" style={{ fontSize: "13.5px", lineHeight: 1.3 }}>{rule.description ?? rule.trigger}</div>
            <div className="sc-hint font-mono" style={{ marginTop: "8px" }}>trigger: {rule.trigger.toLowerCase()}</div>
          </div>
        ))}
      </div>

      {/* Open events */}
      {openEvents.length > 0 && (
        <Panel title={`Open events · ${openEvents.length}`} sub="Escalations that have not yet been resolved">
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

      {/* All events */}
      <Panel title="Recent escalation events" sub="Last 100 escalations · click to resolve" noPadding>
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
