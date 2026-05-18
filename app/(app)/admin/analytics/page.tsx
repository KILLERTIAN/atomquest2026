"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ReferenceLine } from "recharts";
import { Panel, PageHeader, Icon, Avatar } from "@/components/app/ui";
import { BrandBarChart, BrandDonutChart, ChartLegend, PALETTE } from "@/components/charts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const qoqConfig: ChartConfig = {
  avgScore: { label: "Avg Score", color: "var(--chart-1)" },
};

const DEMO_QOQ = [
  { label: "Q1 '25", avgScore: 0.88 },
  { label: "Q2 '25", avgScore: 0.92 },
  { label: "Q3 '25", avgScore: 0.96 },
  { label: "Q4 '25", avgScore: 1.02 },
  { label: "Q1 '26", avgScore: 1.08 },
  { label: "Q2 '26", avgScore: 1.12 },
];
const DEMO_COMPLETION = [
  { label: "FY25 GS",  rate: 78 },
  { label: "FY25 Q1",  rate: 82 },
  { label: "FY25 Q2",  rate: 85 },
  { label: "FY25 Q3",  rate: 88 },
  { label: "FY26 GS",  rate: 91 },
];
const DEMO_THRUST = [
  { name: "Engineering", value: 38, color: PALETTE[0] },
  { name: "Quality",     value: 24, color: PALETTE[1] },
  { name: "Operations",  value: 19, color: PALETTE[2] },
  { name: "People",      value: 14, color: PALETTE[3] },
  { name: "Finance",     value: 9,  color: PALETTE[4] },
];
const DEMO_UOM = [
  { label: "Numeric-min", count: 52 },
  { label: "Numeric-max", count: 34 },
  { label: "Timeline",    count: 28 },
  { label: "Zero",        count: 16 },
];
const DEMO_MGRS = [
  { manager: "Riya Menon",   rate: "96" },
  { manager: "Vikas Talwar", rate: "91" },
  { manager: "Sneha Iyer",   rate: "88" },
  { manager: "Rohan Kapoor", rate: "74" },
  { manager: "Arjun Mehta",  rate: "61" },
];
const MGR_TONES = [
  "oklch(0.92 0.10 92)", "oklch(0.92 0.07 50)",
  "oklch(0.90 0.05 200)", "oklch(0.90 0.04 140)", "oklch(0.90 0.05 30)",
];

export default function AnalyticsPage() {
  const [qoqRange, setQoqRange] = React.useState("all");
  const [qoq, setQoq] = useState<typeof DEMO_QOQ | null>(null);
  const [distribution, setDistribution] = useState<{
    byThrust: { thrustArea: string; _count: { id: number } }[];
    byUom: { uomType: string; _count: { id: number } }[];
  } | null>(null);
  const [managers, setManagers] = useState<typeof DEMO_MGRS | null>(null);
  const [completion, setCompletion] = useState<typeof DEMO_COMPLETION | null>(null);

  useEffect(() => {
    fetch("/api/analytics?type=qoq").then((r) => r.json()).then((d) => {
      const mapped = (d as { quarter?: string; avgScore?: number; count?: number }[])
        .filter((x) => (x.count ?? 0) > 0)
        .map((x) => ({ label: x.quarter ?? "", avgScore: x.avgScore ?? 0 }));
      setQoq(mapped.length > 0 ? mapped : DEMO_QOQ);
    }).catch(() => { setQoq(DEMO_QOQ); });
    fetch("/api/analytics?type=distribution").then((r) => r.json()).then((d) => {
      if (d?.byThrust?.length > 0) setDistribution(d);
    }).catch(() => {});
    fetch("/api/analytics?type=managers").then((r) => r.json()).then((d) => {
      setManagers(d?.length > 0 ? d : DEMO_MGRS);
    }).catch(() => { setManagers(DEMO_MGRS); });
    fetch("/api/analytics?type=completion").then((r) => r.json()).then((d) => {
      const mapped = (d as { cycle?: string; rate?: string | number; total?: number }[])
        .filter((x) => (x.total ?? 0) > 0)
        .map((x) => ({ label: x.cycle ?? "", rate: typeof x.rate === "string" ? parseFloat(x.rate) : (x.rate ?? 0) }));
      setCompletion(mapped.length > 0 ? mapped : DEMO_COMPLETION);
    }).catch(() => { setCompletion(DEMO_COMPLETION); });
  }, []);

  const allQoq = qoq ?? [];
  const qoqData = qoqRange === "all" ? allQoq : allQoq.slice(-parseInt(qoqRange));
  const latestScore = qoqData.at(-1)?.avgScore ?? 0;
  const firstScore  = qoqData.at(0)?.avgScore  ?? latestScore;
  const scoreDelta  = latestScore - firstScore;
  const yMin = Math.max(0.5, Math.floor((Math.min(...qoqData.map(d => d.avgScore), 1) - 0.08) * 10) / 10);
  const yMax = Math.min(1.6, Math.ceil((Math.max(...qoqData.map(d => d.avgScore), 1) + 0.08) * 10) / 10);
  const completionData = completion ?? [];
  const managersData = managers ?? [];

  const thrustData = distribution?.byThrust.map((d, i) => ({
    name: d.thrustArea,
    value: d._count.id,
    color: PALETTE[i % PALETTE.length],
  })) ?? DEMO_THRUST;

  const uomData = distribution?.byUom.map((d) => ({
    label: d.uomType.replace(/_/g, " "),
    count: d._count.id,
  })) ?? DEMO_UOM;

  return (
    <div className="space-y-5 fade-up">
      <PageHeader
        eyebrow="FY 2026 · analytics"
        title="Org performance."
        lede="Quarter-on-quarter trends, completion rates, manager effectiveness, and goal distribution across the org."
        actions={
          <button className="btn-secondary"><Icon name="download" size={14} /> Export data</button>
        }
      />

      <div className="grid-2-1">
        {/* ── Interactive area chart (shadcn pattern) ── */}
        <Card className="pt-0">
          <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
            <div className="grid flex-1 gap-1">
              <div className="flex items-center gap-3">
                <CardTitle>Quarter-on-quarter scores</CardTitle>
                {qoqData.length >= 2 && (
                  <span style={{
                    fontSize: "11px", fontFamily: "var(--font-jetbrains-mono)", fontWeight: 700,
                    padding: "2px 8px", borderRadius: "999px",
                    background: scoreDelta >= 0 ? "oklch(0.70 0.140 150 / 0.15)" : "oklch(0.65 0.18 25 / 0.15)",
                    color: scoreDelta >= 0 ? "oklch(0.50 0.14 150)" : "oklch(0.50 0.18 25)",
                    border: `1px solid ${scoreDelta >= 0 ? "oklch(0.70 0.14 150 / 0.3)" : "oklch(0.65 0.18 25 / 0.3)"}`,
                  }}>
                    {scoreDelta >= 0 ? "↑" : "↓"} {Math.abs(scoreDelta * 100).toFixed(0)}% trend
                  </span>
                )}
              </div>
              <CardDescription>Avg weighted score · dashed line = 1.0× target</CardDescription>
            </div>
            <Select value={qoqRange} onValueChange={(v) => { if (v) setQoqRange(v); }}>
              <SelectTrigger className="hidden w-[160px] rounded-lg sm:ml-auto sm:flex" aria-label="Select range">
                <SelectValue placeholder="All quarters">{qoqRange === "all" ? "All quarters" : `Last ${qoqRange} qtrs`}</SelectValue>
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all" className="rounded-lg">All quarters</SelectItem>
                <SelectItem value="4"   className="rounded-lg">Last 4 quarters</SelectItem>
                <SelectItem value="2"   className="rounded-lg">Last 2 quarters</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
            <ChartContainer config={qoqConfig} className="aspect-auto h-[240px] w-full">
              <AreaChart data={qoqData} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="fillAvgScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"  stopColor="var(--color-avgScore)" stopOpacity={0.6} />
                    <stop offset="60%" stopColor="var(--color-avgScore)" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="var(--color-avgScore)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 5" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={10}
                  style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: 11 }} />
                <YAxis domain={[yMin, yMax]} tickLine={false} axisLine={false} tickMargin={4} width={38}
                  tickFormatter={(v: number) => v.toFixed(2)}
                  style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: 10 }} />
                <ReferenceLine y={1} stroke="var(--muted-foreground)" strokeDasharray="4 3" strokeWidth={1.5}
                  label={{ value: "1.0×", position: "right", fill: "var(--muted-foreground)", fontSize: 10, fontFamily: "var(--font-jetbrains-mono)" }} />
                <ChartTooltip cursor={false} content={
                  <ChartTooltipContent indicator="dot" labelFormatter={(v) => String(v)}
                    formatter={(value) => [(value as number).toFixed(3) + "×", "Score"]} />
                } />
                <Area dataKey="avgScore" type="monotone" fill="url(#fillAvgScore)"
                  stroke="var(--color-avgScore)" strokeWidth={2.5}
                  dot={{ r: 3.5, fill: "var(--color-avgScore)", stroke: "var(--card)", strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: "var(--color-avgScore)", stroke: "var(--card)", strokeWidth: 2 }} />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Panel title="Cycle completion rates" sub="% of sheets approved per cycle">
          <BrandBarChart
            data={completionData}
            bars={[{ key: "rate", label: "Completion %" }]}
            height={240}
          />
        </Panel>
      </div>

      <div className="grid-2-1">
        <Panel title="Goals by thrust area" sub={`Distribution across thrust areas · ${thrustData.reduce((s, d) => s + d.value, 0)} total`}>
          <div className="flex items-center gap-8">
            <BrandDonutChart
              data={thrustData}
              size={200}
              innerRadius={62}
              centerLabel={String(thrustData.reduce((s, d) => s + d.value, 0))}
              centerSub="total goals"
            />
            <div style={{ flex: 1 }}>
              {thrustData.map((d, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: i < thrustData.length - 1 ? "1px dashed oklch(0.92 0.012 88)" : "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ width: "8px", height: "8px", borderRadius: "2px", background: d.color, display: "inline-block" }} />
                    <span style={{ fontSize: "13px" }}>{d.name}</span>
                  </div>
                  <span className="font-mono text-sm" style={{ color: "var(--ink-mute)" }}>{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Panel>

        <Panel title="Goals by measurement type" sub="UoM formula breakdown">
          <BrandBarChart data={uomData} bars={[{ key: "count", label: "Goals" }]} height={200} />
        </Panel>
      </div>

      <Panel title="Manager check-in effectiveness" sub="% of reports checked in on time · target 100%">
        <div className="mgr-list">
          {managersData.map((m, i) => {
            const pct = parseFloat(m.rate) / 100;
            return (
              <div key={m.manager ?? i} className="mgr-row">
                <Avatar name={m.manager ?? "?"} tone={MGR_TONES[i % MGR_TONES.length]} size={26} />
                <div className="mgr-n">{m.manager}</div>
                <div className="mgr-bar">
                  <div className="mgr-fill" style={{ width: `${m.rate}%`, background: pct < 0.7 ? "oklch(0.74 0.16 50)" : "var(--brand-deep)" }} />
                </div>
                <div className="font-mono text-xs" style={{ color: "var(--ink-mute)" }}>{m.rate}%</div>
              </div>
            );
          })}
        </div>
        <ChartLegend items={[
          { label: "≥ 70% — on track", color: "var(--brand-deep)" },
          { label: "< 70% — needs attention", color: "oklch(0.74 0.16 50)" },
        ]} />
      </Panel>
    </div>
  );
}
