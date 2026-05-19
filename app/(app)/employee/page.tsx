import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { StatCard, Panel, PageHeader, WeightBar, StatusPill, Icon } from "@/components/app/ui";

function formatPhase(phase: string) {
  return phase === "GOAL_SETTING" ? "Goal Setting" : phase.replace("_", " ");
}

export default async function EmployeeHome() {
  const session = await auth();
  if (!session) return null;

  const [sheets, activeCycle] = await Promise.all([
    db.goalSheet.findMany({
      where: { employeeId: session.user.id },
      include: { goals: { include: { achievements: true } }, cycle: true },
      orderBy: { createdAt: "desc" },
    }),
    db.goalCycle.findFirst({ where: { isActive: true } }),
  ]);

  const latest = sheets[0] ?? null;
  const name = session.user.name?.split(" ")[0] ?? "there";

  /* ── New user: no sheets ── */
  if (!latest) {
    const steps = [
      { n: "01", title: "Create your goal sheet", body: "Draft up to 8 goals for this cycle. Autosaved — submit only when ready.", icon: "target" as const },
      { n: "02", title: "Balance the weights", body: "Each goal needs a weight. Total must equal exactly 100% before you can submit.", icon: "spark" as const },
      { n: "03", title: "Submit for approval", body: "Your manager reviews and either approves or returns with feedback.", icon: "check" as const },
      { n: "04", title: "Log quarterly actuals", body: "Each quarter, enter your actual results. Score is computed automatically.", icon: "inbox" as const },
    ];

    return (
      <div className="space-y-6 fade-up">
        <PageHeader
          eyebrow={activeCycle ? `${activeCycle.year} · ${formatPhase(activeCycle.phase)}` : "No active cycle"}
          title={`Welcome, ${name}.`}
          lede="Your workspace is ready. Follow the steps below to get started with your first goal sheet."
          actions={
            activeCycle ? (
              <Link href="/employee/goals/new" className="btn-primary">
                <Icon name="plus" size={14} /> Create goal sheet <Icon name="arrow" size={13} />
              </Link>
            ) : undefined
          }
        />

        {activeCycle ? (
          <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 20px", borderRadius: "14px", background: "oklch(0.96 0.07 92)", border: "1px solid oklch(0.88 0.08 92)" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "oklch(0.86 0.175 88)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon name="target" size={16} />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: "13.5px", color: "oklch(0.35 0.10 70)" }}>
                Active cycle: {activeCycle.year} — {formatPhase(activeCycle.phase)}
              </div>
              <div style={{ fontSize: "12px", color: "oklch(0.50 0.08 70)", marginTop: "1px" }}>
                Goal setting window is open · deadline {new Date(activeCycle.closeDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </div>
            </div>
            <div style={{ marginLeft: "auto" }}>
              <Link href="/employee/goals/new" className="btn-primary" style={{ fontSize: "13px", padding: "8px 16px" }}>
                Start now <Icon name="arrow" size={12} />
              </Link>
            </div>
          </div>
        ) : (
          <div style={{ padding: "14px 20px", borderRadius: "14px", background: "oklch(0.96 0.01 80)", border: "1px solid var(--line)", display: "flex", alignItems: "center", gap: "10px" }}>
            <Icon name="clock" size={16} />
            <span style={{ fontSize: "13.5px", color: "var(--ink-mute)" }}>No active cycle yet. Your admin will open one shortly.</span>
          </div>
        )}

        <Panel title="How it works" sub="Four steps to complete your quarter">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", paddingTop: "4px" }}>
            {steps.map((s) => (
              <div key={s.n} style={{ padding: "20px", borderRadius: "12px", border: "1px solid var(--line)", background: "var(--surface-card)", display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "oklch(0.96 0.07 92)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon name={s.icon} size={16} />
                  </div>
                  <span className="font-mono text-xs" style={{ color: "var(--ink-mute)" }}>Step {s.n}</span>
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "13.5px", marginBottom: "4px" }}>{s.title}</div>
                  <div style={{ fontSize: "12.5px", lineHeight: "1.6", color: "var(--ink-mute)" }}>{s.body}</div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    );
  }

  /* ── Returning user: real data ── */
  const totalWeight = latest.goals.reduce((s, g) => s + g.weightage, 0);
  const goalsWithScore = latest.goals.map((g) => {
    const sorted = [...g.achievements].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return { ...g, score: sorted[0]?.computedScore ?? null };
  });

  const approvedCount = sheets.filter((s) => s.status === "APPROVED").length;
  const pendingCount = sheets.filter((s) => s.status === "SUBMITTED").length;

  // Derive active check-in quarter from current month (Indian FY: Q1=Apr-Jun, Q2=Jul-Sep, Q3=Oct-Dec, Q4=Jan-Mar)
  const currentMonth = new Date().getMonth() + 1;
  const activeCheckinQuarter =
    currentMonth >= 4 && currentMonth <= 6 ? "Q1" :
    currentMonth >= 7 && currentMonth <= 9 ? "Q2" :
    currentMonth >= 10 && currentMonth <= 12 ? "Q3" : "Q4";

  const ctaHref =
    latest.status === "APPROVED" ? `/employee/check-ins/${activeCheckinQuarter}` : `/employee/goals/${latest.id}`;
  const ctaLabel =
    latest.status === "DRAFT" ? "Continue editing" :
    latest.status === "SUBMITTED" ? "View sheet" :
    latest.status === "APPROVED" ? "Log actuals" : "Revise sheet";
  const ctaPrimary = latest.status === "APPROVED" || latest.status === "RETURNED";

  return (
    <div className="space-y-5 fade-up">
      <PageHeader
        eyebrow={`${latest.cycle.year} · ${formatPhase(latest.cycle.phase)}`}
        title={`Hello, ${name}.`}
        lede={
          latest.status === "RETURNED"
            ? "Your sheet was returned with feedback. <strong>Review the note and resubmit.</strong>"
            : latest.status === "APPROVED"
            ? "Your sheet is approved and locked. <strong>Log your quarterly actuals when ready.</strong>"
            : latest.status === "SUBMITTED"
            ? "Sheet is under review — waiting for manager approval."
            : "You have a draft in progress. <strong>Submit when weights reach 100%.</strong>"
        }
        actions={
          <>
            <Link href="/employee/goals" className="btn-secondary"><Icon name="download" size={14} /> All sheets</Link>
            <Link href={ctaHref} className={ctaPrimary ? "btn-primary" : "btn-secondary"}>
              {ctaLabel} <Icon name="arrow" size={13} />
            </Link>
          </>
        }
      />

      <div className="stats-row">
        <StatCard
          label="Goals on sheet"
          value={String(latest.goals.length)}
          unit=" / 8"
          hint={`${totalWeight}% weight total`}
          icon={<Icon name="target" size={15} />}
        />
        <StatCard
          label="Sheet status"
          value={latest.status.charAt(0) + latest.status.slice(1).toLowerCase()}
          unit=""
          hint={latest.cycle.year + " · " + formatPhase(latest.cycle.phase)}
          icon={<Icon name="check" size={15} />}
        />
        <StatCard
          label="Sheets approved"
          value={String(approvedCount)}
          unit={` / ${sheets.length}`}
          hint="all time"
          icon={<Icon name="spark" size={15} />}
        />
        <StatCard
          label="Awaiting review"
          value={String(pendingCount)}
          unit=""
          hint="pending manager"
          deltaKind={pendingCount > 0 ? "warn" : undefined}
          icon={<Icon name="clock" size={15} />}
        />
      </div>

      <div className="grid-2-1">
        <Panel
          title={`${latest.cycle.year} — ${formatPhase(latest.cycle.phase)}`}
          sub="Your current goal sheet"
          action={
            <Link href={`/employee/goals/${latest.id}`} className="btn-ghost">
              Open sheet <Icon name="arrow" size={12} />
            </Link>
          }
        >
          {latest.goals.length > 0 ? (
            <>
              <WeightBar goals={latest.goals.map((g) => ({ weight: g.weightage, title: g.title }))} className="weight-bar-standalone" />
              <div style={{ marginTop: "12px" }}>
                {goalsWithScore.map((g, i) => (
                  <div className="goal-row" key={g.id}>
                    <span className="g-idx font-mono text-xs">{String(i + 1).padStart(2, "0")}</span>
                    <div className="g-meta">
                      <div className="g-title">{g.title}</div>
                      <div className="g-sub">{g.thrustArea} · {g.weightage}%</div>
                    </div>
                    <div className="g-prog">
                      {g.score !== null && (
                        <span className="font-mono text-xs" style={{ color: g.score >= 1 ? "var(--ok)" : "var(--warn)" }}>
                          {g.score.toFixed(2)}×
                        </span>
                      )}
                      <StatusPill status={latest.status.toLowerCase() as "draft" | "submitted" | "approved" | "returned"} />
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8" style={{ color: "var(--ink-mute)", fontSize: "13px" }}>
              No goals yet. <Link href={`/employee/goals/${latest.id}`} style={{ color: "var(--brand-deep)" }}>Add goals →</Link>
            </div>
          )}
          {latest.returnNote && (
            <div style={{ marginTop: "14px", padding: "12px 16px", borderRadius: "8px", background: "oklch(0.97 0.06 50)", border: "1px solid oklch(0.88 0.08 50)", borderLeft: "3px solid oklch(0.72 0.16 50)" }}>
              <div className="font-mono text-xs" style={{ color: "oklch(0.55 0.10 50)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Manager note</div>
              <div style={{ fontSize: "13px", color: "oklch(0.35 0.06 50)", lineHeight: "1.6" }}>&ldquo;{latest.returnNote}&rdquo;</div>
            </div>
          )}
        </Panel>

        <Panel title="Cycle history" sub="All your goal sheets">
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {sheets.map((s) => (
              <Link key={s.id} href={`/employee/goals/${s.id}`} style={{ textDecoration: "none" }}>
                <div
                  className="panel-hover"
                  style={{ padding: "12px 14px", borderRadius: "10px", border: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", background: "var(--surface-card)" }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "13px" }}>{s.cycle.year} — {formatPhase(s.cycle.phase)}</div>
                    <div className="font-mono text-xs" style={{ color: "var(--ink-mute)", marginTop: "2px" }}>{s.goals.length} goal{s.goals.length !== 1 ? "s" : ""}</div>
                  </div>
                  <StatusPill status={s.status.toLowerCase() as "draft" | "submitted" | "approved" | "returned"} />
                </div>
              </Link>
            ))}
            {activeCycle && !sheets.find((s) => s.cycleId === activeCycle.id) && (
              <Link href="/employee/goals/new" style={{ textDecoration: "none" }}>
                <div style={{ padding: "12px 14px", borderRadius: "10px", border: "1px dashed oklch(0.86 0.175 88)", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", color: "oklch(0.55 0.12 70)" }}>
                  <Icon name="plus" size={14} />
                  <span style={{ fontSize: "13px" }}>Start {activeCycle.year} — {formatPhase(activeCycle.phase)}</span>
                </div>
              </Link>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}
