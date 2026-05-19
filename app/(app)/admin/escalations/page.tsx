import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/app/ui";
import EscalationsClient from "./EscalationsClient";

type EscRule = { id: string; trigger: string; daysThreshold: number; isActive: boolean; description: string | null };
type EscEvent = {
  id: string; triggeredAt: Date; rule: { trigger: string; daysThreshold: number };
  entityId: string; resolvedAt: Date | null; resolvedBy: { name: string } | null;
};

const DEMO_RULES: EscRule[] = [
  { id: "esc-submission", trigger: "SUBMISSION", daysThreshold: 7, isActive: true, description: "Employee hasn't submitted goals within 7 days of cycle open" },
  { id: "esc-approval",   trigger: "APPROVAL",   daysThreshold: 5, isActive: true, description: "Manager hasn't approved goals within 5 days of submission" },
  { id: "esc-checkin",    trigger: "CHECKIN",     daysThreshold: 3, isActive: true, description: "Employee hasn't logged Q actuals within 3 days of window open" },
];

const DEMO_EVENTS: EscEvent[] = [
  { id: "ev-1", triggeredAt: new Date("2026-05-16T06:10:00"), rule: { trigger: "SUBMISSION", daysThreshold: 7 }, entityId: "sheet-hiren-q2", resolvedAt: null, resolvedBy: null },
  { id: "ev-2", triggeredAt: new Date("2026-05-15T08:00:00"), rule: { trigger: "APPROVAL",   daysThreshold: 5 }, entityId: "sheet-karan-q2", resolvedAt: new Date("2026-05-15T12:30:00"), resolvedBy: { name: "Sarah Manager" } },
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

  const openCount = events.filter((e) => !e.resolvedAt).length;
  const activeCount = rules.filter((r) => r.isActive).length;

  return (
    <div className="space-y-5 fade-up">
      <PageHeader
        eyebrow="admin · escalations"
        title="Escalation rules."
        lede={`${activeCount} active rules · ${openCount} open event${openCount !== 1 ? "s" : ""} · daily cron runs at 08:00 UTC`}
      />
      <EscalationsClient initialRules={rules} events={events} openCount={openCount} />
    </div>
  );
}
