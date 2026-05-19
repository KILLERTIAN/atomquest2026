"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PageHeader, Panel, StatusPill, Icon, WeightBar, Avatar } from "@/components/app/ui";
import { toast } from "sonner";
import Link from "next/link";

const UOM_LABEL: Record<string, string> = {
  NUMERIC_MIN: "Numeric ↑", NUMERIC_MAX: "Numeric ↓", TIMELINE: "Timeline", ZERO: "Zero-based",
};

const THRUST_COLORS: Record<string, string> = {
  Engineering: "oklch(0.93 0.06 240)", Quality: "oklch(0.93 0.06 140)",
  Operations: "oklch(0.93 0.06 50)", Product: "oklch(0.93 0.06 290)",
  People: "oklch(0.93 0.06 10)", Finance: "oklch(0.93 0.06 180)",
};

interface Goal {
  id: string; title: string; thrustArea: string; uomType: string;
  targetValue: number | null; targetDate: string | null;
  weightage: number; isShared: boolean; description: string | null;
}
interface Sheet {
  id: string; status: string; returnNote: string | null;
  employee: { name: string; email: string; avatarUrl?: string | null };
  cycle: { year: number; phase: string };
  goals: Goal[];
}

const inputStyle = {
  width: "100%", padding: "9px 12px", borderRadius: "10px",
  border: "1px solid var(--line-strong)", background: "var(--surface-card)",
  fontSize: "13.5px", color: "var(--ink)", outline: "none", display: "block",
  fontFamily: "var(--font-jetbrains-mono)",
};

export default function ApprovalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const sheetId = params.sheetId as string;

  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [edits, setEdits] = useState<Record<string, { targetValue: string; weightage: string; targetDate: string }>>({});
  const [returnNote, setReturnNote] = useState("");
  const [acting, setActing] = useState(false);

  useEffect(() => {
    fetch(`/api/goals/${sheetId}`)
      .then((r) => { if (!r.ok) { setNotFound(true); return null; } return r.json(); })
      .then((data) => {
        if (!data) return;
        setSheet(data);
        const initial: typeof edits = {};
        data.goals?.forEach((g: Goal) => {
          initial[g.id] = {
            targetValue: g.targetValue?.toString() ?? "",
            weightage: g.weightage.toString(),
            targetDate: g.targetDate ? new Date(g.targetDate).toISOString().split("T")[0] : "",
          };
        });
        setEdits(initial);
      });
  }, [sheetId]);

  async function handleApprove() {
    setActing(true);
    const res = await fetch(`/api/goal-sheets/${sheetId}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        goals: sheet?.goals.map((g) => ({
          id: g.id, thrustArea: g.thrustArea, title: g.title, uomType: g.uomType,
          weightage: parseFloat(edits[g.id]?.weightage ?? String(g.weightage)),
          targetValue: edits[g.id]?.targetValue ? parseFloat(edits[g.id].targetValue) : g.targetValue,
          targetDate: edits[g.id]?.targetDate || g.targetDate || null,
        })),
      }),
    });
    if (res.ok) { toast.success("Goal sheet approved and locked"); router.push("/manager/approvals"); router.refresh(); }
    else toast.error("Failed to approve");
    setActing(false);
  }

  async function handleReturn() {
    if (!returnNote.trim()) { toast.error("Please add a return note"); return; }
    setActing(true);
    const res = await fetch(`/api/goal-sheets/${sheetId}/return`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: returnNote }),
    });
    if (res.ok) { toast.success("Sheet returned for revision"); router.push("/manager/approvals"); router.refresh(); }
    else toast.error("Failed to return sheet");
    setActing(false);
  }

  if (notFound) return (
    <div style={{ padding: "60px 0", textAlign: "center" }}>
      <div style={{ fontWeight: 600, fontSize: "15px", marginBottom: "8px" }}>Sheet not found</div>
      <div style={{ fontSize: "13px", color: "var(--ink-mute)", marginBottom: "20px" }}>This sheet doesn't exist or you don't have access.</div>
      <Link href="/manager/approvals" className="btn-secondary"><Icon name="arrow" size={13} /> Back to approvals</Link>
    </div>
  );

  if (!sheet) return (
    <div style={{ padding: "60px 0", textAlign: "center", color: "var(--ink-mute)", fontSize: "13.5px", fontFamily: "var(--font-jetbrains-mono)" }}>
      Loading…
    </div>
  );

  const totalWeight = sheet.goals.reduce(
    (s, g) => s + (parseFloat(edits[g.id]?.weightage ?? String(g.weightage)) || 0), 0
  );
  const isSubmitted = sheet.status === "SUBMITTED";
  const canApprove = isSubmitted && Math.abs(totalWeight - 100) < 0.01;
  const formatPhase = (p: string) => p === "GOAL_SETTING" ? "Goal Setting" : p.replace("_", " ");

  return (
    <div className="space-y-5 fade-up" style={{ maxWidth: "860px" }}>
      <PageHeader
        eyebrow={`manager · approvals · ${sheet.cycle.year}`}
        title={`${sheet.employee.name.split(" ")[0]}'s goals.`}
        lede={`${sheet.cycle.year} — ${formatPhase(sheet.cycle.phase)} · ${sheet.goals.length} goal${sheet.goals.length !== 1 ? "s" : ""} · ${totalWeight.toFixed(0)}% weighted`}
        actions={
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <StatusPill status={sheet.status.toLowerCase() as "draft" | "submitted" | "approved" | "returned"} />
            <Link href="/manager/approvals" className="btn-ghost" style={{ fontSize: "12px", padding: "7px 14px" }}>
              ← All sheets
            </Link>
          </div>
        }
      />

      {/* Employee identity bar */}
      <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "14px 18px", borderRadius: "14px", background: "var(--surface-card)", border: "1px solid var(--line)" }}>
        <Avatar name={sheet.employee.name} size={40} tone="oklch(0.92 0.10 92)" />
        <div>
          <div style={{ fontWeight: 600, fontSize: "14px" }}>{sheet.employee.name}</div>
          <div style={{ fontSize: "12px", color: "var(--ink-mute)", fontFamily: "var(--font-jetbrains-mono)", marginTop: "1px" }}>{sheet.employee.email}</div>
        </div>
        <div style={{ marginLeft: "auto", textAlign: "right" }}>
          <div style={{ fontSize: "11px", color: "var(--ink-mute)", textTransform: "uppercase", letterSpacing: "0.07em", fontFamily: "var(--font-jetbrains-mono)" }}>Cycle</div>
          <div style={{ fontSize: "13px", fontWeight: 600, marginTop: "1px" }}>{sheet.cycle.year} · {formatPhase(sheet.cycle.phase)}</div>
        </div>
      </div>

      {/* Return note callout */}
      {sheet.returnNote && (
        <div style={{ display: "flex", gap: "14px", padding: "16px 20px", borderRadius: "12px", background: "oklch(0.97 0.04 55)", border: "1px solid oklch(0.88 0.08 55)", borderLeft: "4px solid oklch(0.72 0.18 50)" }}>
          <Icon name="bell" size={16} />
          <div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "oklch(0.50 0.14 50)", textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "var(--font-jetbrains-mono)", marginBottom: "4px" }}>Previous return note</div>
            <p style={{ margin: 0, fontSize: "13.5px", lineHeight: 1.6, color: "oklch(0.28 0.08 55)", fontStyle: "italic" }}>&ldquo;{sheet.returnNote}&rdquo;</p>
          </div>
        </div>
      )}

      {/* Goal cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {sheet.goals.map((goal, i) => {
          const tColor = THRUST_COLORS[goal.thrustArea] ?? "oklch(0.93 0.04 80)";
          const wEdit = edits[goal.id]?.weightage ?? String(goal.weightage);
          const tvEdit = edits[goal.id]?.targetValue ?? (goal.targetValue?.toString() ?? "");

          return (
            <div key={goal.id} className="panel">
              <div style={{ padding: "18px 20px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
                  {/* Left: index + meta */}
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", flex: 1 }}>
                    <div style={{ width: "34px", height: "34px", borderRadius: "10px", background: "oklch(0.96 0.07 92)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "1px" }}>
                      <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--brand-deep)", fontFamily: "var(--font-jetbrains-mono)" }}>{i + 1}</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "6px" }}>
                        <span style={{ fontWeight: 600, fontSize: "14px", color: "var(--ink)" }}>{goal.title}</span>
                        {goal.isShared && <span className="pill shared">shared</span>}
                      </div>
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "99px", background: tColor, color: "oklch(0.25 0.06 80)", fontWeight: 600 }}>{goal.thrustArea}</span>
                        <span style={{ fontSize: "11px", color: "var(--ink-mute)", fontFamily: "var(--font-jetbrains-mono)" }}>{UOM_LABEL[goal.uomType] ?? goal.uomType}</span>
                      </div>
                    </div>
                  </div>
                  {/* Right: weightage (editable if SUBMITTED) */}
                  <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
                    {isSubmitted ? (
                      <div>
                        <div style={{ fontSize: "9px", color: "var(--ink-mute)", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "var(--font-jetbrains-mono)", marginBottom: "4px", textAlign: "right" }}>Weightage %</div>
                        <input
                          type="number"
                          min={10}
                          max={100}
                          value={wEdit}
                          onChange={(e) => setEdits((p) => ({ ...p, [goal.id]: { ...p[goal.id], weightage: e.target.value } }))}
                          style={{ ...inputStyle, width: "76px", textAlign: "right", fontSize: "18px", fontWeight: 700, padding: "6px 10px" }}
                        />
                      </div>
                    ) : (
                      <span style={{ fontSize: "22px", fontWeight: 700, fontFamily: "var(--font-instrument-serif)", color: "var(--brand-deep)", lineHeight: 1 }}>{goal.weightage}%</span>
                    )}
                  </div>
                </div>

                {/* Description + target */}
                {(goal.description || goal.targetValue != null || goal.targetDate) && (
                  <div style={{ marginTop: "14px", paddingTop: "12px", borderTop: "1px dashed var(--line)", display: "flex", gap: "20px", flexWrap: "wrap", alignItems: "flex-start" }}>
                    {goal.description && (
                      <p style={{ margin: 0, fontSize: "13px", color: "var(--ink-mute)", lineHeight: 1.6, flex: "1 1 180px" }}>{goal.description}</p>
                    )}
                    <div style={{ display: "flex", gap: "20px", flexShrink: 0 }}>
                      {(goal.uomType === "NUMERIC_MIN" || goal.uomType === "NUMERIC_MAX") && (
                        <div>
                          <div style={{ fontSize: "9px", color: "var(--ink-mute)", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "var(--font-jetbrains-mono)", marginBottom: "2px" }}>Target</div>
                          {isSubmitted && !goal.isShared ? (
                            <input
                              type="number"
                              value={tvEdit}
                              onChange={(e) => setEdits((p) => ({ ...p, [goal.id]: { ...p[goal.id], targetValue: e.target.value } }))}
                              style={{ ...inputStyle, width: "100px", fontSize: "15px", fontWeight: 700, padding: "5px 9px" }}
                            />
                          ) : (
                            <div style={{ fontSize: "18px", fontWeight: 700, fontFamily: "var(--font-jetbrains-mono)", color: "var(--ink)" }}>{goal.targetValue ?? "—"}</div>
                          )}
                        </div>
                      )}
                      {(goal.uomType === "TIMELINE" || goal.targetDate) && (
                        <div>
                          <div style={{ fontSize: "9px", color: "var(--ink-mute)", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "var(--font-jetbrains-mono)", marginBottom: "2px" }}>Deadline</div>
                          {isSubmitted && !goal.isShared ? (
                            <input
                              type="date"
                              value={edits[goal.id]?.targetDate ?? ""}
                              onChange={(e) => setEdits((p) => ({ ...p, [goal.id]: { ...p[goal.id], targetDate: e.target.value } }))}
                              style={{ ...inputStyle, width: "150px", fontSize: "13px", fontWeight: 600, padding: "5px 9px" }}
                            />
                          ) : (
                            <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--ink)" }}>
                              {goal.targetDate ? new Date(goal.targetDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div style={{ height: "4px", background: `linear-gradient(90deg, var(--brand) ${goal.weightage}%, var(--line) ${goal.weightage}%)` }} />
            </div>
          );
        })}
      </div>

      {/* Weight summary */}
      <Panel title="Weight distribution" sub={isSubmitted ? "Adjust per goal above — must total exactly 100% to approve" : "Sum of all goal weightages"}>
        <WeightBar goals={sheet.goals.map((g, i) => ({ weight: parseFloat(edits[g.id]?.weightage ?? String(g.weightage)) || g.weightage, title: g.title }))} className="weight-bar-standalone" />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px" }}>
          <span style={{ fontSize: "12px", color: "var(--ink-mute)", fontFamily: "var(--font-jetbrains-mono)" }}>{totalWeight.toFixed(0)}% of 100% allocated</span>
          {Math.abs(totalWeight - 100) > 0.01 && (
            <span style={{ fontSize: "12px", color: "var(--warn)", fontFamily: "var(--font-jetbrains-mono)" }}>
              {totalWeight < 100 ? `${(100 - totalWeight).toFixed(0)}% unallocated` : `${(totalWeight - 100).toFixed(0)}% over budget`}
            </span>
          )}
          {Math.abs(totalWeight - 100) < 0.01 && (
            <span style={{ fontSize: "12px", color: "var(--ok)", fontFamily: "var(--font-jetbrains-mono)" }}>✓ exactly 100%</span>
          )}
        </div>
      </Panel>

      {/* Action panel — SUBMITTED only */}
      {isSubmitted && (
        <Panel title="Your decision" sub="Approve to lock this sheet, or return it with specific feedback">
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Approve */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px", borderRadius: "12px", background: canApprove ? "oklch(0.96 0.06 140)" : "var(--bg-elev)", border: `1px solid ${canApprove ? "oklch(0.88 0.08 140)" : "var(--line)"}` }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: "13.5px", color: canApprove ? "oklch(0.35 0.12 140)" : "var(--ink-mute)" }}>Approve &amp; lock</div>
                <div style={{ fontSize: "12px", color: canApprove ? "oklch(0.50 0.10 140)" : "var(--ink-mute)", marginTop: "2px" }}>
                  {canApprove ? "Weights sum to 100% — ready to approve" : "Weights must total exactly 100% before approving"}
                </div>
              </div>
              <button
                onClick={handleApprove}
                disabled={acting || !canApprove}
                className="btn-primary"
                style={{ opacity: (!canApprove || acting) ? 0.5 : 1, cursor: (!canApprove || acting) ? "not-allowed" : "pointer", fontSize: "13px", padding: "9px 18px" }}
              >
                {acting ? "Saving…" : "Approve"} <Icon name="check" size={13} />
              </button>
            </div>

            {/* Return */}
            <div style={{ padding: "16px 18px", borderRadius: "12px", background: "var(--surface-card)", border: "1px solid var(--line)" }}>
              <div style={{ fontWeight: 600, fontSize: "13.5px", marginBottom: "10px" }}>Return for revision</div>
              <textarea
                value={returnNote}
                onChange={(e) => setReturnNote(e.target.value)}
                rows={3}
                placeholder="Explain what needs to be changed — be specific. E.g. 'Goal 2 target is too low, revise to ≥ 90%'"
                style={{
                  width: "100%", padding: "10px 13px", borderRadius: "10px",
                  border: "1px solid var(--line-strong)", background: "var(--bg)",
                  fontSize: "13.5px", color: "var(--ink)", resize: "vertical",
                  fontFamily: "inherit", outline: "none", lineHeight: 1.6,
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "var(--brand)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "var(--line-strong)"; }}
              />
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "12px" }}>
                <button
                  onClick={handleReturn}
                  disabled={acting}
                  className="btn-ghost"
                  style={{ fontSize: "13px", padding: "9px 18px", color: "oklch(0.52 0.14 50)", borderColor: "oklch(0.85 0.07 50)" }}
                >
                  {acting ? "Sending…" : "Return sheet"}
                </button>
                <span style={{ fontSize: "11.5px", color: "var(--ink-mute)", marginLeft: "auto" }}>{returnNote.length} chars</span>
              </div>
            </div>
          </div>
        </Panel>
      )}

      {/* Already-actioned state */}
      {!isSubmitted && (
        <Panel title="Sheet already actioned" sub="">
          <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "4px 0" }}>
            <StatusPill status={sheet.status.toLowerCase() as "draft" | "submitted" | "approved" | "returned"} />
            <span style={{ fontSize: "13px", color: "var(--ink-mute)" }}>
              {sheet.status === "APPROVED" && "This sheet is locked. Only an admin can unlock it."}
              {sheet.status === "RETURNED" && "Awaiting employee revision before it can be re-reviewed."}
              {sheet.status === "DRAFT" && "Employee hasn't submitted this sheet yet."}
            </span>
          </div>
        </Panel>
      )}
    </div>
  );
}
