import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { StatCard, Panel, PageHeader, Avatar, StatusPill, Icon } from "@/components/app/ui";

function formatPhase(phase: string) {
  return phase === "GOAL_SETTING" ? "Goal Setting" : phase.replace("_", " ");
}

const TONE_BY_IDX = [
  "oklch(0.92 0.10 92)", "oklch(0.92 0.07 50)", "oklch(0.90 0.05 200)",
  "oklch(0.90 0.04 140)", "oklch(0.90 0.05 30)", "oklch(0.92 0.05 270)",
  "oklch(0.90 0.06 310)", "oklch(0.92 0.08 170)",
];

export default async function ManagerHome() {
  const session = await auth();
  if (!session) return null;
  const name = session.user.name?.split(" ")[0] ?? "there";

  const [reports, activeCycle, pendingSheets] = await Promise.all([
    db.user.findMany({
      where: { managerId: session.user.id },
      include: {
        goalSheets: {
          include: { goals: true, cycle: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { name: "asc" },
    }),
    db.goalCycle.findFirst({ where: { isActive: true } }),
    db.goalSheet.findMany({
      where: {
        status: "SUBMITTED",
        employee: { managerId: session.user.id },
      },
      include: { employee: true, goals: true },
      orderBy: { submittedAt: "asc" },
    }),
  ]);

  const ACTION_LABEL: Record<string, string> = {
    SUBMITTED: "Review →",
    RETURNED:  "See note",
    DRAFT:     "View",
    APPROVED:  "Open",
  };

  const approvedCount = reports.filter((r) => r.goalSheets[0]?.status === "APPROVED").length;
  const noSheetCount = reports.filter((r) => r.goalSheets.length === 0).length;

  /* ── Empty state: no reports ── */
  if (reports.length === 0) {
    return (
      <div className="space-y-6 fade-up">
        <PageHeader
          eyebrow={activeCycle ? `${activeCycle.year} · ${formatPhase(activeCycle.phase)}` : "Manager view"}
          title={`Hello, ${name}.`}
          lede="No direct reports assigned yet. Ask your admin to assign team members to you."
        />
        <Panel title="Getting started" sub="What you can do as a manager">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px", paddingTop: "4px" }}>
            {[
              { icon: "users" as const, title: "Review goal sheets", body: "When team members submit their sheets, you'll see them here for approval." },
              { icon: "check" as const, title: "Approve or return", body: "Approve to lock a sheet for the quarter, or return it with feedback." },
              { icon: "inbox" as const, title: "Add check-in notes", body: "Add quarterly comments to guide your team's progress." },
              { icon: "spark" as const, title: "Track team scores", body: "Monitor individual and team performance scores across the quarter." },
            ].map((s) => (
              <div key={s.title} style={{ padding: "18px", borderRadius: "12px", border: "1px solid var(--line)", background: "var(--surface-card)" }}>
                <div style={{ width: "34px", height: "34px", borderRadius: "10px", background: "oklch(0.96 0.07 92)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "10px" }}>
                  <Icon name={s.icon} size={15} />
                </div>
                <div style={{ fontWeight: 600, fontSize: "13px", marginBottom: "4px" }}>{s.title}</div>
                <div style={{ fontSize: "12px", color: "var(--ink-mute)", lineHeight: "1.6" }}>{s.body}</div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    );
  }

  return (
    <div className="space-y-5 fade-up">
      <PageHeader
        eyebrow={`Team · ${reports.length} report${reports.length !== 1 ? "s" : ""}`}
        title={`Hello, ${name}.`}
        lede={
          pendingSheets.length > 0
            ? `<strong>${pendingSheets.length} sheet${pendingSheets.length !== 1 ? "s" : ""} need your review.</strong> ${noSheetCount > 0 ? `${noSheetCount} team member${noSheetCount !== 1 ? "s" : ""} haven't started yet.` : "All others are on track."}`
            : noSheetCount > 0
            ? `${noSheetCount} team member${noSheetCount !== 1 ? "s" : ""} haven't submitted yet. Everything else looks good.`
            : "All sheets reviewed. Your team is on track."
        }
        actions={
          <>
            {pendingSheets.length > 0 && (
              <Link href="/manager/approvals" className="btn-primary">
                Review queue ({pendingSheets.length}) <Icon name="arrow" size={13} />
              </Link>
            )}
            <Link href="/manager/team" className="btn-secondary">
              <Icon name="users" size={14} /> Team view
            </Link>
          </>
        }
      />

      <div className="stats-row">
        <StatCard
          label="Awaiting review"
          value={String(pendingSheets.length)}
          unit=""
          hint="submitted sheets"
          deltaKind={pendingSheets.length > 0 ? "warn" : undefined}
          icon={<Icon name="check" size={15} />}
        />
        <StatCard
          label="Approved"
          value={String(approvedCount)}
          unit={` / ${reports.length}`}
          hint="sheets locked"
          deltaKind={approvedCount === reports.length ? "ok" : undefined}
          icon={<Icon name="spark" size={15} />}
        />
        <StatCard
          label="Not started"
          value={String(noSheetCount)}
          unit=""
          hint="no sheet this cycle"
          deltaKind={noSheetCount > 0 ? "warn" : undefined}
          icon={<Icon name="flag" size={15} />}
        />
        <StatCard
          label="Total reports"
          value={String(reports.length)}
          unit=""
          hint="direct reports"
          icon={<Icon name="users" size={15} />}
        />
      </div>

      <Panel
        title="Team status"
        sub="Latest goal sheet per person"
        action={<Link href="/manager/approvals" className="btn-ghost">Approvals <Icon name="arrow" size={12} /></Link>}
        noPadding
      >
        {/* Header row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 60px 70px 90px", padding: "6px 20px 6px", borderBottom: "1px solid var(--line)" }}>
          {["Person", "Status", "Goals", "Weight", ""].map((h) => (
            <div key={h} style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: "10.5px", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-mute)", padding: "4px 0" }}>{h}</div>
          ))}
        </div>
        {reports.map((r, i) => {
          const sheet = r.goalSheets[0];
          const tone = TONE_BY_IDX[i % TONE_BY_IDX.length];
          const totalWeight = sheet?.goals.reduce((s, g) => s + g.weightage, 0) ?? 0;
          const sheetHref = sheet ? `/manager/approvals/${sheet.id}` : "#";
          const isLast = i === reports.length - 1;
          return (
            <div key={r.id} style={{ display: "grid", gridTemplateColumns: "1fr 120px 60px 70px 90px", padding: "12px 20px", borderBottom: isLast ? "none" : "1px solid oklch(0.94 0.01 88)", alignItems: "center" }}>
              {/* Person */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Avatar name={r.name} tone={tone} size={32} />
                <div>
                  <div style={{ fontWeight: 500, fontSize: "13.5px" }}>{r.name}</div>
                  <div style={{ fontSize: "11px", color: "var(--ink-mute)", fontFamily: "var(--font-jetbrains-mono)" }}>{r.email}</div>
                </div>
              </div>
              {/* Status */}
              <div>
                {sheet
                  ? <StatusPill status={sheet.status.toLowerCase() as "draft" | "submitted" | "approved" | "returned"} />
                  : <span style={{ fontSize: "11px", color: "var(--ink-mute)", fontFamily: "var(--font-jetbrains-mono)" }}>no sheet</span>}
              </div>
              {/* Goals */}
              <div style={{ fontSize: "13px" }}>{sheet ? sheet.goals.length : "—"}</div>
              {/* Weight */}
              <div style={{ fontSize: "12px", fontFamily: "var(--font-jetbrains-mono)", fontWeight: 600, color: totalWeight === 100 ? "var(--ok)" : sheet ? "var(--warn)" : "var(--ink-mute)" }}>
                {sheet ? `${totalWeight}%` : "—"}
              </div>
              {/* Action */}
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                {sheet ? (
                  <Link href={sheetHref} className="btn-ghost" style={{ fontSize: "12px", padding: "4px 10px" }}>
                    {ACTION_LABEL[sheet.status] ?? "Open"} →
                  </Link>
                ) : (
                  <span style={{ fontSize: "12px", color: "var(--ink-mute)" }}>—</span>
                )}
              </div>
            </div>
          );
        })}
      </Panel>

      {pendingSheets.length > 0 && (
        <Panel
          title="Pending approvals"
          sub="Submitted sheets waiting for your review"
          action={<Link href="/manager/approvals" className="btn-ghost">View all <Icon name="arrow" size={12} /></Link>}
        >
          <div className="approve-stack">
            {pendingSheets.slice(0, 3).map((sheet, i) => {
              const tone = TONE_BY_IDX[i % TONE_BY_IDX.length];
              const totalWeight = sheet.goals.reduce((s, g) => s + g.weightage, 0);
              const ago = sheet.submittedAt
                ? (() => {
                    const diff = Date.now() - new Date(sheet.submittedAt).getTime();
                    const h = Math.floor(diff / 3_600_000);
                    const d = Math.floor(diff / 86_400_000);
                    return h < 1 ? "just now" : h < 24 ? `${h}h ago` : `${d}d ago`;
                  })()
                : "—";
              return (
                <div key={sheet.id} className="approve-stack-row">
                  <Avatar name={sheet.employee.name} tone={tone} size={40} />
                  <div className="as-meta">
                    <div className="as-n">
                      {sheet.employee.name}{" "}
                      <span className="font-mono text-xs" style={{ color: "var(--ink-mute)" }}>· {ago}</span>
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: "var(--ink-mute)" }}>
                      {sheet.goals.length} goals · {totalWeight}% weight
                    </div>
                  </div>
                  <Link href={`/manager/approvals/${sheet.id}`} className="btn-primary" style={{ fontSize: 12, padding: "6px 12px" }}>
                    Review <Icon name="arrow" size={11} />
                  </Link>
                </div>
              );
            })}
          </div>
        </Panel>
      )}
    </div>
  );
}
