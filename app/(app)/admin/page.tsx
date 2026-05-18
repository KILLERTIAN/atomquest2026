import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { StatCard, Panel, PageHeader, ActivityFeed, Icon } from "@/components/app/ui";

function formatPhase(phase: string) {
  return phase === "GOAL_SETTING" ? "Goal Setting" : phase.replace("_", " ");
}

type AuditEntry = {
  id: string; entityType: string; action: string; createdAt: Date;
  changedBy: { name: string; email: string };
};
const DEMO_ACTIVITY: AuditEntry[] = [
  { id: "d1", entityType: "goalcycle", action: "create",  createdAt: new Date("2026-05-10T08:42:00"), changedBy: { name: "Admin User",    email: "admin@demo.com"              } },
  { id: "d2", entityType: "goalsheet", action: "approve", createdAt: new Date("2026-05-14T08:11:00"), changedBy: { name: "Sarah Manager",  email: "manager@demo.com"            } },
  { id: "d3", entityType: "goalsheet", action: "submit",  createdAt: new Date("2026-05-13T07:31:00"), changedBy: { name: "Aryan Shah",     email: "aryan.shah@atomberg.com"     } },
  { id: "d4", entityType: "goalsheet", action: "submit",  createdAt: new Date("2026-05-12T09:22:00"), changedBy: { name: "Priya Nair",     email: "priya.nair@atomberg.com"     } },
  { id: "d5", entityType: "goalsheet", action: "approve", createdAt: new Date("2026-05-12T11:04:00"), changedBy: { name: "Sarah Manager",  email: "manager@demo.com"            } },
  { id: "d6", entityType: "goalsheet", action: "return",  createdAt: new Date("2026-05-11T16:22:00"), changedBy: { name: "Riya Menon",     email: "riya.menon@atomberg.com"     } },
  { id: "d7", entityType: "goalsheet", action: "update",  createdAt: new Date("2026-05-11T14:08:00"), changedBy: { name: "Anika Sharma",   email: "anika.sharma@atomberg.com"   } },
  { id: "d8", entityType: "user",      action: "create",  createdAt: new Date("2026-05-09T10:30:00"), changedBy: { name: "Admin User",     email: "admin@demo.com"              } },
];

export default async function AdminHome() {
  const session = await auth();
  if (!session) return null;

  const [userCount, activeCycle, sheetStats, recentAudit, pendingCount] = await Promise.all([
    db.user.count(),
    db.goalCycle.findFirst({ where: { isActive: true } }),
    db.goalSheet.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    db.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { changedBy: { select: { name: true, email: true } } },
    }),
    db.goalSheet.count({ where: { status: "SUBMITTED" } }),
  ]);

  const statusMap = Object.fromEntries(sheetStats.map((s) => [s.status, s._count._all]));
  const totalSheets = sheetStats.reduce((acc, s) => acc + s._count._all, 0);
  const approvedSheets = statusMap["APPROVED"] ?? 0;
  const approvalRate = totalSheets > 0 ? Math.round((approvedSheets / totalSheets) * 100) : 0;

  const formatAgo = (date: Date) => {
    const diff = Date.now() - new Date(date).getTime();
    const m = Math.floor(diff / 60_000);
    const h = Math.floor(diff / 3_600_000);
    const days = Math.floor(diff / 86_400_000);
    if (m < 1) return "just now";
    if (h < 1) return `${m} min ago`;
    if (h < 24) return `${h}h ago`;
    if (days === 1) return "yesterday";
    return `${days} days ago`;
  };

  const formatDate = (date: Date) =>
    new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: true });

  type ActionMeta = { label: string; color: string; bg: string };
  const ACTION_MAP: Record<string, ActionMeta> = {
    "goalsheet.create":   { label: "created a goal sheet",              color: "oklch(0.45 0.14 240)", bg: "oklch(0.94 0.05 240)" },
    "goalsheet.submit":   { label: "submitted a goal sheet for review", color: "oklch(0.50 0.14 200)", bg: "oklch(0.94 0.04 200)" },
    "goalsheet.approve":  { label: "approved a goal sheet",             color: "oklch(0.42 0.14 145)", bg: "oklch(0.94 0.05 145)" },
    "goalsheet.return":   { label: "returned a goal sheet for revision",color: "oklch(0.52 0.16 50)",  bg: "oklch(0.95 0.05 50)"  },
    "goalsheet.unlock":   { label: "unlocked a goal sheet",             color: "oklch(0.45 0.14 290)", bg: "oklch(0.94 0.05 290)" },
    "goalsheet.update":   { label: "edited a goal sheet",               color: "oklch(0.45 0.06 80)",  bg: "oklch(0.95 0.03 80)"  },
    "goal.create":        { label: "added a new goal",                  color: "oklch(0.45 0.14 240)", bg: "oklch(0.94 0.05 240)" },
    "goal.update":        { label: "updated a goal",                    color: "oklch(0.45 0.06 80)",  bg: "oklch(0.95 0.03 80)"  },
    "user.create":        { label: "added a new user",                  color: "oklch(0.42 0.14 145)", bg: "oklch(0.94 0.05 145)" },
    "user.update":        { label: "updated a user's profile",          color: "oklch(0.45 0.06 80)",  bg: "oklch(0.95 0.03 80)"  },
    "user.delete":        { label: "removed a user",                    color: "oklch(0.50 0.16 28)",  bg: "oklch(0.96 0.05 28)"  },
    "goalcycle.create":   { label: "created a performance cycle",       color: "oklch(0.42 0.14 145)", bg: "oklch(0.94 0.05 145)" },
    "goalcycle.update":   { label: "updated cycle settings",            color: "oklch(0.45 0.06 80)",  bg: "oklch(0.95 0.03 80)"  },
  };

  function getActionMeta(entityType: string, action: string): ActionMeta {
    const key = `${entityType.toLowerCase()}.${action.toLowerCase()}`;
    return ACTION_MAP[key] ?? { label: `${action.toLowerCase()} ${entityType.toLowerCase()}`, color: "var(--ink-mute)", bg: "oklch(0.95 0.01 80)" };
  }

  return (
    <div className="space-y-5 fade-up">
      <PageHeader
        eyebrow={activeCycle ? `${activeCycle.year} · ${formatPhase(activeCycle.phase)} · cycle live` : "No active cycle"}
        title="Org overview."
        lede={
          activeCycle
            ? `${userCount} people · cycle phase <strong>${formatPhase(activeCycle.phase)}</strong> · closes ${new Date(activeCycle.closeDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`
            : `${userCount} people registered · no active cycle. <strong>Create one to get started.</strong>`
        }
        actions={
          <>
            <Link href="/admin/cycles" className="btn-secondary"><Icon name="clock" size={14} /> Manage cycles</Link>
            <Link href="/admin/users" className="btn-primary"><Icon name="users" size={14} /> Manage users</Link>
          </>
        }
      />

      {!activeCycle && (
        <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 20px", borderRadius: "14px", background: "oklch(0.97 0.065 28)", border: "1px solid oklch(0.88 0.08 28)" }}>
          <Icon name="flag" size={16} />
          <div>
            <div style={{ fontWeight: 600, fontSize: "13.5px", color: "oklch(0.45 0.12 28)" }}>No active cycle</div>
            <div style={{ fontSize: "12px", color: "oklch(0.55 0.10 28)", marginTop: "1px" }}>Create a cycle to allow employees to submit goal sheets.</div>
          </div>
          <div style={{ marginLeft: "auto" }}>
            <Link href="/admin/cycles" className="btn-primary" style={{ fontSize: "13px", padding: "8px 16px" }}>
              Create cycle <Icon name="arrow" size={12} />
            </Link>
          </div>
        </div>
      )}

      <div className="stats-row">
        <StatCard
          label="Total users"
          value={String(userCount)}
          unit=""
          hint="registered accounts"
          icon={<Icon name="users" size={15} />}
        />
        <StatCard
          label="Goal sheets"
          value={String(totalSheets)}
          unit=""
          hint={`${approvedSheets} approved`}
          deltaKind={approvedSheets > 0 ? "ok" : undefined}
          icon={<Icon name="target" size={15} />}
        />
        <StatCard
          label="Approval rate"
          value={String(approvalRate)}
          unit="%"
          hint="approved of submitted"
          icon={<Icon name="spark" size={15} />}
        />
        <StatCard
          label="Pending review"
          value={String(pendingCount)}
          unit=""
          hint="awaiting managers"
          deltaKind={pendingCount > 0 ? "warn" : undefined}
          icon={<Icon name="check" size={15} />}
        />
      </div>

      <div className="grid-2-1">
        <Panel
          title="Sheet status breakdown"
          sub="All goal sheets across the org"
          action={<Link href="/admin/reports" className="btn-ghost">Full report <Icon name="arrow" size={12} /></Link>}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {[
              { label: "Approved", key: "APPROVED", color: "var(--ok)" },
              { label: "Submitted", key: "SUBMITTED", color: "oklch(0.78 0.14 55)" },
              { label: "Draft", key: "DRAFT", color: "var(--ink-mute)" },
              { label: "Returned", key: "RETURNED", color: "oklch(0.74 0.16 50)" },
            ].map((row) => {
              const count = statusMap[row.key] ?? 0;
              const pct = totalSheets > 0 ? (count / totalSheets) * 100 : 0;
              return (
                <div key={row.key} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "12px", color: "var(--ink-mute)", width: "72px", flexShrink: 0 }}>{row.label}</span>
                  <div style={{ flex: 1, height: "6px", borderRadius: "99px", background: "oklch(0.92 0.01 80)", overflow: "hidden" }}>
                    <div style={{ height: "100%", borderRadius: "99px", width: `${pct}%`, background: row.color, transition: "width 0.3s" }} />
                  </div>
                  <span className="font-mono text-xs" style={{ color: "var(--ink-mute)", width: "28px", textAlign: "right" }}>{count}</span>
                </div>
              );
            })}
          </div>
          {totalSheets === 0 && (
            <div style={{ textAlign: "center", paddingTop: "8px", color: "var(--ink-mute)", fontSize: "13px" }}>
              No sheets created yet.
            </div>
          )}
        </Panel>

        <Panel
          title="Quick actions"
          sub="Common admin tasks"
        >
          <div className="qa-list">
            <Link href="/admin/users" style={{ textDecoration: "none" }}>
              <div className="qa-item" style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px", borderRadius: "10px", border: "1px solid var(--line)", cursor: "pointer", background: "var(--surface-card)", marginBottom: "8px" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "oklch(0.96 0.07 92)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon name="users" size={14} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "13px" }}>Manage users</div>
                  <div style={{ fontSize: "11.5px", color: "var(--ink-mute)" }}>Create, edit or remove accounts</div>
                </div>
                <Icon name="arrow" size={13} />
              </div>
            </Link>
            <Link href="/admin/cycles" style={{ textDecoration: "none" }}>
              <div className="qa-item" style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px", borderRadius: "10px", border: "1px solid var(--line)", cursor: "pointer", background: "var(--surface-card)", marginBottom: "8px" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "oklch(0.96 0.07 92)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon name="clock" size={14} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "13px" }}>Cycle management</div>
                  <div style={{ fontSize: "11.5px", color: "var(--ink-mute)" }}>Open, close or adjust cycles</div>
                </div>
                <Icon name="arrow" size={13} />
              </div>
            </Link>
            <Link href="/admin/audit" style={{ textDecoration: "none" }}>
              <div className="qa-item" style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px", borderRadius: "10px", border: "1px solid var(--line)", cursor: "pointer", background: "var(--surface-card)" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "oklch(0.96 0.07 92)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon name="inbox" size={14} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "13px" }}>Audit trail</div>
                  <div style={{ fontSize: "11.5px", color: "var(--ink-mute)" }}>View all system activity</div>
                </div>
                <Icon name="arrow" size={13} />
              </div>
            </Link>
          </div>
        </Panel>
      </div>

      <Panel
        title="Recent activity"
        sub="What's been happening across the organisation"
        action={<Link href="/admin/audit" className="btn-ghost">Full audit <Icon name="arrow" size={12} /></Link>}
      >
        {(() => {
          const displayLogs: AuditEntry[] = recentAudit.length > 0
            ? recentAudit.map((l) => ({ id: l.id, entityType: l.entityType, action: l.action, createdAt: l.createdAt, changedBy: l.changedBy }))
            : DEMO_ACTIVITY;
          return (
            <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
              {displayLogs.map((log, i) => {
                const meta = getActionMeta(log.entityType, log.action);
                const initials = log.changedBy.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
                return (
                  <div
                    key={log.id}
                    style={{
                      display: "flex", alignItems: "center", gap: "14px",
                      padding: "12px 0",
                      borderBottom: i < displayLogs.length - 1 ? "1px solid var(--line)" : "none",
                    }}
                  >
                    <div style={{ width: 34, height: 34, borderRadius: "50%", background: meta.bg, color: meta.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700, flexShrink: 0, fontFamily: "var(--font-jetbrains-mono)" }}>
                      {initials}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: "13.5px", color: "var(--ink)", lineHeight: 1.4 }}>
                        <span style={{ fontWeight: 600 }}>{log.changedBy.name}</span>
                        {" "}
                        <span style={{ color: "var(--ink-soft)" }}>{meta.label}</span>
                      </p>
                      <p style={{ margin: "2px 0 0", fontSize: "11.5px", color: "var(--ink-mute)", fontFamily: "var(--font-jetbrains-mono)" }}>
                        {formatDate(log.createdAt)}
                      </p>
                    </div>
                    <span style={{ fontSize: "11.5px", color: "var(--ink-mute)", fontFamily: "var(--font-jetbrains-mono)", flexShrink: 0, background: "var(--bg-elev)", border: "1px solid var(--line)", borderRadius: "6px", padding: "2px 8px" }}>
                      {formatAgo(log.createdAt)}
                    </span>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </Panel>
    </div>
  );
}
