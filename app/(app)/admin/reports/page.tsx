"use client";

import { useEffect, useState } from "react";
import { Panel, PageHeader, Icon } from "@/components/app/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface Cycle { id: string; year: number; phase: string; _count: { goalSheets: number } }
interface CompletionStat { cycle?: string; total: number; approved: number; rate: string | number }

const PHASE_LABEL: Record<string, string> = {
  GOAL_SETTING: "Goal Setting", Q1: "Q1 Check-in", Q2: "Q2 Check-in", Q3: "Q3 Check-in", Q4: "Q4 / Annual",
};

const DEMO_STATS: CompletionStat[] = [
  { cycle: "FY 2026 · Goal Setting", total: 42, approved: 38, rate: "91" },
  { cycle: "FY 2025 · Q4",           total: 98, approved: 88, rate: "90" },
  { cycle: "FY 2025 · Q3",           total: 95, approved: 83, rate: "87" },
  { cycle: "FY 2025 · Q2",           total: 91, approved: 77, rate: "85" },
  { cycle: "FY 2025 · Q1",           total: 88, approved: 72, rate: "82" },
];

const EXPORT_PRESETS = [
  { title: "Achievement report", desc: "All goals + actuals + scores for a given cycle", icon: "target" as const, tag: "recommended" },
  { title: "Manager effectiveness", desc: "Response times and check-in rates per manager", icon: "users" as const, tag: "" },
  { title: "Full org export", desc: "Every goal, every person, all quarters", icon: "bar" as const, tag: "" },
];

export default function ReportsPage() {
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [selectedCycle, setSelectedCycle] = useState("");
  const [stats, setStats] = useState<CompletionStat[]>(DEMO_STATS);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetch("/api/cycles").then((r) => r.json()).then((d) => { if (d?.length > 0) setCycles(d); }).catch(() => {});
    fetch("/api/analytics?type=completion").then((r) => r.json()).then((d) => { if (d?.length > 0) setStats(d); }).catch(() => {});
  }, []);

  async function handleExport() {
    setDownloading(true);
    try {
      const url = `/api/reports/export${selectedCycle ? `?cycleId=${selectedCycle}` : ""}`;
      const res = await fetch(url);
      if (!res.ok) { toast.error("Export failed"); return; }
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = `achievement-report-${Date.now()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(objectUrl), 100);
      toast.success("Export downloaded");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="space-y-5 fade-up">
      <PageHeader
        eyebrow="admin · reports"
        title="Reports & export."
        lede="Download achievement data as Excel. Every goal, every person, all quarters in one sheet."
        actions={
          <button className="btn-secondary" onClick={handleExport} disabled={downloading}><Icon name="download" size={14} /> Bulk export</button>
        }
      />

      <div className="stats-row">
        {EXPORT_PRESETS.map((preset, i) => (
          <div key={i} className="stat-card" style={{ cursor: "pointer" }}
            onClick={() => {
              if (preset.title === "Manager effectiveness") {
                (async () => {
                  try {
                    const res = await fetch("/api/analytics?type=managers");
                    const d = await res.json();
                    if (!d?.length) { toast.info("No manager data available yet."); return; }
                    const XLSX = await import("xlsx");
                    const ws = XLSX.utils.json_to_sheet(d);
                    const wb = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wb, ws, "Manager Effectiveness");
                    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
                    const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a"); a.href = url; a.download = "manager-effectiveness.xlsx";
                    document.body.appendChild(a); a.click(); document.body.removeChild(a);
                    setTimeout(() => URL.revokeObjectURL(url), 100);
                    toast.success("Downloaded manager effectiveness report");
                  } catch { toast.error("Failed to load manager data"); }
                })();
              } else {
                handleExport();
              }
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
              <div className="sc-icon"><Icon name={preset.icon} size={16} /></div>
              {preset.tag && (
                <span className="pill" style={{ background: "oklch(0.96 0.07 92)", color: "oklch(0.45 0.14 60)", fontSize: "10.5px" }}>{preset.tag}</span>
              )}
            </div>
            <div className="sc-val" style={{ fontSize: "15px", marginTop: "14px" }}>{preset.title}</div>
            <div className="sc-hint">{preset.desc}</div>
          </div>
        ))}
      </div>

      <Panel title="Export achievement report" sub="Download an Excel file with all goals, actuals, and scores">
        <div className="flex items-end gap-4 flex-wrap">
          <div>
            <div style={{ fontSize: "11.5px", fontFamily: "var(--font-jetbrains-mono)", color: "var(--ink-mute)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>Filter by cycle</div>
            <div style={{ width: "260px" }}>
              <Select value={selectedCycle} onValueChange={(v) => setSelectedCycle(v ?? "")}>
                <SelectTrigger><SelectValue placeholder="All cycles" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All cycles</SelectItem>
                  {cycles.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.year} — {PHASE_LABEL[c.phase] ?? c.phase}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <button className="btn-primary" onClick={handleExport} disabled={downloading}>
            <Icon name="download" size={14} /> {downloading ? "Generating…" : "Download Excel"}
          </button>
        </div>
      </Panel>

      <Panel title="Cycle completion" sub="% of sheets approved per cycle">
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {stats.map((s, i) => {
            const pct = typeof s.rate === "string" ? parseFloat(s.rate) : s.rate;
            const color = pct >= 88 ? "var(--ok)" : pct >= 70 ? "oklch(0.86 0.175 88)" : "oklch(0.74 0.16 50)";
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "16px", paddingBottom: "14px", borderBottom: i < stats.length - 1 ? "1px dashed oklch(0.92 0.012 88)" : "none" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, fontSize: "13.5px" }}>{s.cycle}</div>
                  <div className="font-mono text-xs" style={{ color: "var(--ink-mute)", marginTop: "2px" }}>{s.approved} / {s.total} approved</div>
                </div>
                <div style={{ width: "160px", height: "6px", background: "oklch(0.92 0.012 88)", borderRadius: "999px", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: "999px", transition: "width 0.6s cubic-bezier(.2,.7,.2,1)" }} />
                </div>
                <div className="font-mono text-sm" style={{ width: "42px", textAlign: "right", color }}>{pct}%</div>
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}
