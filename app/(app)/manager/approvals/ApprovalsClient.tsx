"use client";

import { useState } from "react";
import Link from "next/link";
import { Panel, Avatar, StatusPill, Icon, FilterPills } from "@/components/app/ui";

const TONES = [
  "oklch(0.92 0.10 92)", "oklch(0.92 0.07 50)", "oklch(0.90 0.05 200)",
  "oklch(0.90 0.04 140)", "oklch(0.90 0.05 30)", "oklch(0.92 0.05 270)",
];

const STATUS_FILTERS = [
  { label: "All", value: "all" },
  { label: "Pending", value: "SUBMITTED" },
  { label: "Approved", value: "APPROVED" },
  { label: "Returned", value: "RETURNED" },
  { label: "Draft", value: "DRAFT" },
];

interface Sheet {
  id: string;
  status: string;
  submittedAt: Date | null;
  employee: { name: string; email: string };
  cycle: { year: number; phase: string };
  goals: { id: string; weightage: number }[];
}

export function ApprovalsClient({ sheets }: { sheets: Sheet[] }) {
  const [statusFilter, setStatusFilter] = useState("all");

  const pending = sheets.filter((s) => s.status === "SUBMITTED");
  const filtered = statusFilter === "all" ? sheets : sheets.filter((s) => s.status === statusFilter);

  return (
    <>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <FilterPills options={STATUS_FILTERS} active={statusFilter} onChange={setStatusFilter} />
      </div>

      {statusFilter === "all" && pending.length > 0 && (
        <Panel title={`Needs review · ${pending.length}`} sub="Submitted and awaiting your approval or return">
          <div className="approve-stack">
            {pending.map((sheet, i) => (
              <div key={sheet.id} className="approve-stack-row">
                <Avatar name={sheet.employee.name} tone={TONES[i % TONES.length]} size={42} />
                <div className="as-meta">
                  <div className="as-n">
                    {sheet.employee.name}
                    <span className="font-mono text-xs" style={{ color: "var(--ink-mute)", marginLeft: "8px" }}>
                      · {sheet.submittedAt ? new Date(sheet.submittedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "just now"}
                    </span>
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--ink-mute)" }}>
                    {sheet.goals.length} goals · {sheet.goals.reduce((s, g) => s + g.weightage, 0)}% weight · {sheet.cycle.year} {sheet.cycle.phase.replace("_", " ")}
                  </div>
                </div>
                <Link href={`/manager/approvals/${sheet.id}`} className="btn-ghost" style={{ fontSize: "12px", padding: "6px 10px" }}>Return</Link>
                <Link href={`/manager/approvals/${sheet.id}`} className="btn-primary" style={{ fontSize: "12px", padding: "6px 12px" }}>
                  Review <Icon name="arrow" size={11} />
                </Link>
              </div>
            ))}
          </div>
        </Panel>
      )}

      <Panel title={statusFilter === "all" ? "All sheets" : `${STATUS_FILTERS.find(f => f.value === statusFilter)?.label ?? statusFilter} sheets`} sub="Full history for your direct reports" noPadding>
        <table className="audit-tbl">
          <thead>
            <tr><th>Employee</th><th>Cycle</th><th>Goals</th><th>Status</th><th>Submitted</th><th></th></tr>
          </thead>
          <tbody>
            {filtered.map((sheet, i) => (
              <tr key={sheet.id}>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <Avatar name={sheet.employee.name} tone={TONES[i % TONES.length]} size={28} />
                    <div>
                      <div style={{ fontWeight: 500, fontSize: "13.5px" }}>{sheet.employee.name}</div>
                      <div className="font-mono text-xs" style={{ color: "var(--ink-mute)" }}>{sheet.employee.email}</div>
                    </div>
                  </div>
                </td>
                <td className="font-mono text-xs" style={{ color: "var(--ink-mute)" }}>{sheet.cycle.year} · {sheet.cycle.phase.replace("_", " ")}</td>
                <td className="font-mono text-sm">{sheet.goals.length}</td>
                <td><StatusPill status={sheet.status.toLowerCase() as "draft" | "submitted" | "approved" | "returned"} /></td>
                <td className="font-mono text-xs" style={{ color: "var(--ink-mute)" }}>
                  {sheet.submittedAt ? new Date(sheet.submittedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—"}
                </td>
                <td>
                  <Link href={`/manager/approvals/${sheet.id}`} className="btn-row">
                    {sheet.status === "SUBMITTED" ? "Review →" : "Open"}
                  </Link>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: "center", color: "var(--ink-mute)", padding: "24px" }}>No sheets match this filter</td></tr>
            )}
          </tbody>
        </table>
      </Panel>
    </>
  );
}
