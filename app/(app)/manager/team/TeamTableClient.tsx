"use client";

import React, { useState } from "react";
import { Avatar, StatusPill, FilterPills, ThemedSelect } from "@/components/app/ui";

const TONES = [
  "oklch(0.92 0.10 92)", "oklch(0.92 0.07 50)", "oklch(0.90 0.05 200)",
  "oklch(0.90 0.04 140)", "oklch(0.90 0.05 30)", "oklch(0.92 0.05 270)",
];

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "APPROVED", label: "Approved" },
  { value: "SUBMITTED", label: "Submitted" },
  { value: "RETURNED", label: "Returned" },
  { value: "DRAFT", label: "Draft" },
];

function scoreColor(score: number) {
  if (score >= 1.0) return "var(--ok)";
  if (score >= 0.7) return "oklch(0.86 0.175 88)";
  return "oklch(0.74 0.16 50)";
}

type Sheet = {
  status: string;
  goals: { thrustArea: string; achievements: { computedScore: number | null }[] }[];
  cycle: { year: number; phase: string };
};

type Member = {
  id: string; name: string; email: string;
  goalSheets: Sheet[];
};

export function TeamTableClient({ team }: { team: Member[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filtered = team.filter((m) => {
    const sheet = m.goalSheets[0];
    const matchStatus = statusFilter === "all" || (sheet ? sheet.status === statusFilter : statusFilter === "DRAFT");
    const matchSearch = !search || m.name.toLowerCase().includes(search.toLowerCase()) || m.email.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <>
      {/* Toolbar: search + filter + page size in one row */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 16px", borderBottom: "1px solid var(--line)", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: "180px" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--ink-mute)" }}>
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name or email…"
            style={{ paddingLeft: "32px", height: "34px", borderRadius: "8px", border: "1px solid var(--line-strong)", background: "var(--bg)", fontSize: "13px", color: "var(--ink)", width: "100%", outline: "none" }}
          />
        </div>
        <FilterPills options={STATUS_FILTERS} active={statusFilter} onChange={(v) => { setStatusFilter(v); setPage(1); }} />
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginLeft: "auto" }}>
          <span style={{ fontSize: "11.5px", color: "var(--ink-mute)", fontFamily: "var(--font-jetbrains-mono)", whiteSpace: "nowrap" }}>Show</span>
          <ThemedSelect
            value={String(pageSize)}
            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
            options={[{ value: "10", label: "10" }, { value: "25", label: "25" }, { value: "50", label: "50" }]}
            style={{ padding: "4px 8px", fontSize: "12px", minWidth: "60px" }}
          />
        </div>
      </div>

      <div className="team-grid">
        {["Person", "Status", "Goals", "Score", "Thrust areas", ""].map((h, i) => (
          <div key={i} className="th">{h}</div>
        ))}
        {paginated.length === 0 && (
          <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "48px", color: "var(--ink-mute)", fontFamily: "var(--font-jetbrains-mono)", fontSize: "13px" }}>
            No team members found
          </div>
        )}
        {paginated.map((member, i) => {
          const sheet = member.goalSheets[0];
          const tone = TONES[(filtered.indexOf(member)) % TONES.length];
          const avgScore = sheet
            ? sheet.goals.reduce((sum, g) => {
                const latest = g.achievements[g.achievements.length - 1];
                return sum + (latest?.computedScore ?? 0);
              }, 0) / (sheet.goals.length || 1)
            : null;

          return (
            <React.Fragment key={member.id ?? i}>
              <div className="tc tc-name">
                <Avatar name={member.name} tone={tone} size={32} />
                <div>
                  <div className="t-n">{member.name}</div>
                  <div className="text-[11px] font-mono" style={{ color: "var(--ink-mute)" }}>{member.email}</div>
                </div>
              </div>
              <div className="tc">
                {sheet ? (
                  <StatusPill status={sheet.status.toLowerCase() as "draft" | "submitted" | "approved" | "returned"} />
                ) : (
                  <span className="pill" style={{ background: "oklch(0.95 0.01 80)", color: "var(--ink-mute)" }}>no sheet</span>
                )}
              </div>
              <div className="tc text-sm font-mono">{sheet ? sheet.goals.length : "—"}</div>
              <div className="tc">
                {avgScore != null && avgScore > 0 ? (
                  <span className="font-mono text-sm" style={{ color: scoreColor(avgScore) }}>{avgScore.toFixed(2)}×</span>
                ) : (
                  <span style={{ color: "var(--ink-mute)" }}>—</span>
                )}
              </div>
              <div className="tc">
                {sheet && sheet.goals.length > 0 ? (
                  <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                    {Array.from(new Set(sheet.goals.map((g) => g.thrustArea))).slice(0, 3).map((area, j) => (
                      <span key={j} className="pill" style={{ fontSize: "10.5px", background: "oklch(0.96 0.04 92)", color: "oklch(0.45 0.10 80)" }}>{area}</span>
                    ))}
                  </div>
                ) : (
                  <span style={{ color: "var(--ink-mute)" }}>—</span>
                )}
              </div>
              <div className="tc tc-action">
                <button className="btn-row">
                  {!sheet ? "Nudge" : sheet.status === "SUBMITTED" ? "Review →" : sheet.status === "RETURNED" ? "View note" : "Open"}
                </button>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* Pagination footer */}
      {filtered.length > pageSize && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderTop: "1px solid var(--line)" }}>
          <span style={{ fontSize: "12px", color: "var(--ink-mute)", fontFamily: "var(--font-jetbrains-mono)" }}>
            {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, filtered.length)} of {filtered.length}
          </span>
          <div style={{ display: "flex", gap: "4px" }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              style={{ padding: "5px 10px", borderRadius: "7px", border: "1px solid var(--line)", background: "var(--surface-card)", fontSize: "12px", color: safePage === 1 ? "var(--ink-mute)" : "var(--ink)", cursor: safePage === 1 ? "default" : "pointer" }}
            >← Prev</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => Math.abs(p - safePage) <= 2 || p === 1 || p === totalPages)
              .map((p, idx, arr) => (
                <span key={p} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  {idx > 0 && arr[idx - 1] !== p - 1 && <span style={{ padding: "5px 4px", fontSize: "12px", color: "var(--ink-mute)" }}>…</span>}
                  <button
                    onClick={() => setPage(p)}
                    style={{ padding: "5px 10px", borderRadius: "7px", border: `1px solid ${p === safePage ? "var(--brand)" : "var(--line)"}`, background: p === safePage ? "oklch(0.97 0.04 80)" : "var(--surface-card)", fontSize: "12px", color: p === safePage ? "var(--brand-deep)" : "var(--ink)", cursor: "pointer", fontWeight: p === safePage ? 600 : 400 }}
                  >{p}</button>
                </span>
              ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              style={{ padding: "5px 10px", borderRadius: "7px", border: "1px solid var(--line)", background: "var(--surface-card)", fontSize: "12px", color: safePage === totalPages ? "var(--ink-mute)" : "var(--ink)", cursor: safePage === totalPages ? "default" : "pointer" }}
            >Next →</button>
          </div>
        </div>
      )}
    </>
  );
}
