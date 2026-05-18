import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader, Panel, Icon } from "@/components/app/ui";

type AuditLog = {
  id: string; createdAt: Date;
  changedBy: { name: string; email: string } | null;
  entityType: string; entityId: string; action: string;
  newValue: Record<string, unknown>;
};

/* ─── Risk classification ─── */
type Risk = "danger" | "warn" | "normal";

function getRisk(action: string, newValue: Record<string, unknown>): Risk {
  const a = action.toUpperCase();
  if (
    (a === "UPDATED" && newValue.role === "ADMIN") ||
    (a === "CREATED" && newValue.role === "ADMIN") ||
    a === "USER_DELETED" || a === "ADMIN_GRANTED"
  ) return "danger";
  if (
    a === "UNLOCKED" ||
    a.includes("ROLE") ||
    (a === "UPDATED" && "role" in newValue) ||
    a === "MANAGER_CHANGED" ||
    (a === "CREATED" && "trigger" in newValue)
  ) return "warn";
  return "normal";
}

/* ─── Plain-English summary ─── */
function summarise(action: string, entityType: string, newValue: Record<string, unknown>): string {
  const a = action.toUpperCase();
  const e = entityType;

  if (e === "GoalSheet") {
    if (a === "SUBMITTED") return "Goal sheet submitted for manager review";
    if (a === "APPROVED")  return "Goal sheet approved and locked";
    if (a === "RETURNED")  return `Goal sheet returned${newValue.note ? ` — "${newValue.note}"` : " with feedback"}`;
    if (a === "UNLOCKED")  return "Goal sheet unlocked by admin (goals can now be edited)";
    if (a === "UPDATED")   return "Goal sheet updated";
  }
  if (e === "User") {
    if (a === "CREATED")  return `New user created${newValue.role ? ` as ${String(newValue.role).toLowerCase()}` : ""}`;
    if (a === "UPDATED") {
      if (newValue.role)      return `User role changed to ${String(newValue.role).toLowerCase()}`;
      if (newValue.name)      return `User name updated to "${newValue.name}"`;
      if (newValue.email)     return `User email updated`;
      return "User profile updated";
    }
    if (a === "MANAGER_CHANGED" || (a === "UPDATED" && "managerId" in newValue))
      return "User's reporting manager reassigned";
  }
  if (e === "GoalCycle") {
    if (a === "CREATED") return `New goal cycle created${newValue.year ? ` for ${newValue.year}` : ""}`;
    if (a === "UPDATED") return "Goal cycle settings updated";
  }
  if (e === "Achievement") {
    if (a === "UPDATED") return `Quarterly actual logged${newValue.computedScore != null ? ` — score ${Number(newValue.computedScore).toFixed(2)}×` : ""}`;
    if (a === "CREATED") return "New quarterly actual recorded";
  }
  if (e === "EscalationRule") {
    if (a === "CREATED") return `Escalation rule created${newValue.trigger ? ` (${String(newValue.trigger).toLowerCase()} trigger)` : ""}`;
    if (a === "UPDATED") return "Escalation rule updated";
  }
  return `${a.toLowerCase().replace(/_/g, " ")} on ${e}`;
}

/* ─── Pretty-print changes ─── */
const FIELD_LABELS: Record<string, string> = {
  role: "Role", status: "Status", name: "Name", email: "Email",
  managerId: "Manager", phase: "Phase", year: "Year",
  actualValue: "Actual", computedScore: "Score", note: "Note", trigger: "Trigger",
};

function formatChanges(newValue: Record<string, unknown>): string {
  const parts: string[] = [];
  for (const [k, v] of Object.entries(newValue)) {
    if (v === null || v === undefined) continue;
    const label = FIELD_LABELS[k] ?? k;
    const val = typeof v === "string" ? v : JSON.stringify(v);
    if (k === "managerId") { parts.push(`${label}: reassigned`); continue; }
    parts.push(`${label}: ${val}`);
  }
  return parts.slice(0, 4).join(" · ") || "—";
}

const RISK_META: Record<Risk, { bg: string; color: string; border: string; label: string }> = {
  danger: { bg: "oklch(0.96 0.06 22)", color: "oklch(0.44 0.18 22)", border: "oklch(0.85 0.10 22)", label: "High risk" },
  warn:   { bg: "oklch(0.96 0.07 70)", color: "oklch(0.46 0.14 65)", border: "oklch(0.86 0.12 70)", label: "Sensitive" },
  normal: { bg: "oklch(0.95 0.04 90)", color: "oklch(0.45 0.10 80)", border: "transparent",          label: "" },
};

const ENTITY_LABELS: Record<string, string> = {
  GoalSheet: "Goal sheet", GoalCycle: "Cycle", User: "User",
  Achievement: "Check-in", EscalationRule: "Escalation", Goal: "Goal",
};

const DEMO_LOGS: AuditLog[] = [
  { id: "1", createdAt: new Date("2026-05-16T08:42:00"), changedBy: { name: "Admin User", email: "admin@demo.com" }, entityType: "GoalCycle", entityId: "cycle-2026", action: "CREATED", newValue: { phase: "GOAL_SETTING", year: 2026 } },
  { id: "2", createdAt: new Date("2026-05-16T08:11:00"), changedBy: { name: "Sarah Manager", email: "manager@demo.com" }, entityType: "GoalSheet", entityId: "sheet-anika", action: "APPROVED", newValue: { status: "APPROVED" } },
  { id: "3", createdAt: new Date("2026-05-16T07:58:00"), changedBy: { name: "Sarah Manager", email: "manager@demo.com" }, entityType: "GoalSheet", entityId: "sheet-karan", action: "RETURNED", newValue: { note: "Please revise goal 3" } },
  { id: "4", createdAt: new Date("2026-05-16T07:31:00"), changedBy: { name: "John Employee", email: "emp@demo.com" }, entityType: "GoalSheet", entityId: "sheet-john", action: "SUBMITTED", newValue: { status: "SUBMITTED" } },
  { id: "5", createdAt: new Date("2026-05-16T06:10:00"), changedBy: { name: "Admin User", email: "admin@demo.com" }, entityType: "User", entityId: "user-riya", action: "UPDATED", newValue: { role: "ADMIN" } },
  { id: "6", createdAt: new Date("2026-05-15T16:22:00"), changedBy: { name: "Admin User", email: "admin@demo.com" }, entityType: "GoalSheet", entityId: "sheet-devika", action: "UNLOCKED", newValue: {} },
  { id: "7", createdAt: new Date("2026-05-15T14:08:00"), changedBy: { name: "Anika Sharma", email: "anika@atomberg.com" }, entityType: "Achievement", entityId: "ach-rma-q2", action: "UPDATED", newValue: { actualValue: 0.71, computedScore: 1.13 } },
  { id: "8", createdAt: new Date("2026-05-15T10:30:00"), changedBy: { name: "Admin User", email: "admin@demo.com" }, entityType: "User", entityId: "user-mira", action: "MANAGER_CHANGED", newValue: { managerId: "mgr-vikas" } },
];

export default async function AuditPage() {
  const session = await auth();
  if (!session) return null;

  let logs: AuditLog[] = DEMO_LOGS;
  try {
    const dbLogs = await db.auditLog.findMany({
      include: { changedBy: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    if (dbLogs.length > 0) {
      logs = dbLogs.map((l) => ({
        id: l.id, createdAt: l.createdAt, changedBy: l.changedBy,
        entityType: l.entityType, entityId: l.entityId, action: l.action,
        newValue: (l.newValue ?? {}) as Record<string, unknown>,
      }));
    }
  } catch { logs = DEMO_LOGS; }

  const dangerCount = logs.filter((l) => getRisk(l.action, l.newValue) === "danger").length;

  return (
    <div className="space-y-5 fade-up">
      <PageHeader
        eyebrow="admin · audit"
        title="Audit trail."
        lede={`Every action logged · ${logs.length} entries${dangerCount > 0 ? ` · <strong style="color:oklch(0.44 0.18 22)">${dangerCount} high-risk</strong>` : ""}`}
        actions={<button className="btn-secondary"><Icon name="download" size={14} /> Export CSV</button>}
      />

      {dangerCount > 0 && (
        <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", padding: "14px 18px", borderRadius: "14px", background: "oklch(0.97 0.04 22)", border: "1px solid oklch(0.88 0.08 22)", borderLeft: "3px solid oklch(0.60 0.18 22)" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "oklch(0.92 0.10 22)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "oklch(0.44 0.18 22)" }}>
            <Icon name="flag" size={15} />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: "13.5px", color: "oklch(0.38 0.16 22)" }}>{dangerCount} high-risk action{dangerCount !== 1 ? "s" : ""} detected</div>
            <div style={{ fontSize: "12.5px", color: "oklch(0.50 0.10 22)", marginTop: "2px", lineHeight: 1.5 }}>
              Actions like granting admin access or unlocking approved sheets are marked below. Review them carefully.
            </div>
          </div>
        </div>
      )}

      <Panel title="All actions" sub="Most recent first — hover a row for full details" noPadding>
        {/* Header */}
        <div style={{ display: "grid", gridTemplateColumns: "130px 180px 110px 1fr 2fr", padding: "6px 20px", borderBottom: "1px solid var(--line)" }}>
          {["When", "By", "Type", "What happened", "Details"].map((h) => (
            <div key={h} style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: "10.5px", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-mute)", padding: "4px 0" }}>{h}</div>
          ))}
        </div>

        {logs.map((log, i) => {
          const risk = getRisk(log.action, log.newValue);
          const rm = RISK_META[risk];
          const isLast = i === logs.length - 1;
          const summary = summarise(log.action, log.entityType, log.newValue);
          const changes = formatChanges(log.newValue);
          const entityLabel = ENTITY_LABELS[log.entityType] ?? log.entityType;

          return (
            <div key={log.id} style={{
              display: "grid", gridTemplateColumns: "130px 180px 110px 1fr 2fr",
              padding: "13px 20px", alignItems: "center",
              borderBottom: isLast ? "none" : "1px solid oklch(0.94 0.01 88)",
              borderLeft: risk !== "normal" ? `3px solid ${rm.border}` : "3px solid transparent",
              background: risk !== "normal" ? rm.bg + "66" : "transparent",
            }}>
              {/* When */}
              <div style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: "11.5px", color: "var(--ink-mute)" }}>
                {new Date(log.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
              </div>

              {/* By */}
              <div>
                <div style={{ fontWeight: 500, fontSize: "13px" }}>{log.changedBy?.name ?? "System"}</div>
                <div style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: "10.5px", color: "var(--ink-mute)" }}>{log.changedBy?.email ?? ""}</div>
              </div>

              {/* Type */}
              <div style={{ fontSize: "12px", color: "var(--ink-mute)" }}>{entityLabel}</div>

              {/* What happened */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <span style={{ fontSize: "13px" }}>{summary}</span>
                {risk !== "normal" && (
                  <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 7px", borderRadius: "999px", background: rm.bg, color: rm.color, border: `1px solid ${rm.border}`, fontFamily: "var(--font-jetbrains-mono)", letterSpacing: "0.05em", textTransform: "uppercase", flexShrink: 0 }}>
                    {rm.label}
                  </span>
                )}
              </div>

              {/* Details */}
              <div style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: "11.5px", color: "var(--ink-mute)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {changes}
              </div>
            </div>
          );
        })}
      </Panel>
    </div>
  );
}
