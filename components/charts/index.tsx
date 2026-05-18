"use client";

import {
  LineChart as ReLineChart,
  Line,
  BarChart as ReBarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  ReferenceLine,
} from "recharts";

/* Brand palette */
export const BRAND = {
  yellow:    "oklch(0.86 0.175 88)",
  yellowDeep:"oklch(0.72 0.180 75)",
  charcoal:  "oklch(0.136 0.022 72)",
  ok:        "oklch(0.70 0.140 150)",
  warn:      "oklch(0.74 0.160 50)",
  mute:      "oklch(0.78 0.02 80)",
  line:      "oklch(0.90 0.015 88)",
} as const;

/* Sequence of hues for multi-series charts */
export const PALETTE = [
  "oklch(0.86 0.175 88)",
  "oklch(0.78 0.16 70)",
  "oklch(0.72 0.165 60)",
  "oklch(0.66 0.16 50)",
  "oklch(0.70 0.140 150)",
  "oklch(0.82 0.16 78)",
];

const TICK_STYLE = { fill: "oklch(0.60 0.018 80)", fontSize: 11, fontFamily: "var(--font-jetbrains-mono)" };

/* Custom tooltip */
function BrandTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "var(--surface-card)", border: "1px solid var(--line)", borderRadius: "10px", padding: "10px 14px", boxShadow: "0 8px 24px -10px oklch(0.4 0.04 80 / 0.22)", fontSize: "12.5px", fontFamily: "var(--font-jetbrains-mono)" }}>
      {label && <div style={{ color: "oklch(0.60 0.018 80)", marginBottom: "6px" }}>{label}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", color: "oklch(0.18 0.018 75)" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "2px", background: p.color, display: "inline-block" }} />
          {p.name}: <strong>{p.value}</strong>
        </div>
      ))}
    </div>
  );
}

/* ── Area / Line chart ── */
export interface LineDataPoint { [key: string]: string | number }

export function BrandLineChart({
  data,
  lines,
  height = 280,
  referenceLine,
}: {
  data: LineDataPoint[];
  lines: { key: string; label: string; color?: string; dashed?: boolean }[];
  height?: number;
  referenceLine?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
        <defs>
          {lines.map((l, i) => {
            const c = l.color ?? PALETTE[i % PALETTE.length];
            return (
              <linearGradient key={l.key} id={`grad-${l.key}`} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={c} stopOpacity={0.3} />
                <stop offset="100%" stopColor={c} stopOpacity={0} />
              </linearGradient>
            );
          })}
        </defs>
        <CartesianGrid stroke="oklch(0.92 0.012 88)" strokeDasharray="2 4" vertical={false} />
        <XAxis dataKey="label" tick={TICK_STYLE} axisLine={false} tickLine={false} />
        <YAxis tick={TICK_STYLE} axisLine={false} tickLine={false} />
        <Tooltip content={<BrandTooltip />} />
        {referenceLine != null && <ReferenceLine y={referenceLine} stroke={BRAND.warn} strokeDasharray="4 4" strokeWidth={1.5} />}
        {lines.map((l, i) => {
          const c = l.color ?? PALETTE[i % PALETTE.length];
          return (
            <Area
              key={l.key}
              type="monotone"
              dataKey={l.key}
              name={l.label}
              stroke={c}
              strokeWidth={2}
              strokeDasharray={l.dashed ? "5 4" : undefined}
              fill={`url(#grad-${l.key})`}
              dot={false}
              activeDot={{ r: 4, fill: c, stroke: "#fdfaf2", strokeWidth: 2 }}
            />
          );
        })}
      </AreaChart>
    </ResponsiveContainer>
  );
}

/* ── Bar chart ── */
export function BrandBarChart({
  data,
  bars,
  height = 260,
}: {
  data: LineDataPoint[];
  bars: { key: string; label: string; color?: string }[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ReBarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }} barCategoryGap="30%">
        <CartesianGrid stroke="oklch(0.92 0.012 88)" strokeDasharray="2 4" vertical={false} />
        <XAxis dataKey="label" tick={TICK_STYLE} axisLine={false} tickLine={false} />
        <YAxis tick={TICK_STYLE} axisLine={false} tickLine={false} />
        <Tooltip content={<BrandTooltip />} />
        {bars.map((b, i) => (
          <Bar key={b.key} dataKey={b.key} name={b.label} fill={b.color ?? PALETTE[i % PALETTE.length]} radius={[4, 4, 0, 0]} />
        ))}
      </ReBarChart>
    </ResponsiveContainer>
  );
}

/* ── Donut / Pie chart ── */
export function BrandDonutChart({
  data,
  size = 180,
  innerRadius = 56,
  centerLabel,
  centerSub,
}: {
  data: { name: string; value: number; color?: string }[];
  size?: number;
  innerRadius?: number;
  centerLabel?: string;
  centerSub?: string;
}) {
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <PieChart width={size} height={size}>
        <Pie data={data} cx={size / 2 - 1} cy={size / 2 - 1} innerRadius={innerRadius} outerRadius={size / 2 - 8} paddingAngle={2} dataKey="value" strokeWidth={0}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color ?? PALETTE[i % PALETTE.length]} />
          ))}
        </Pie>
        <Tooltip content={<BrandTooltip />} />
      </PieChart>
      {(centerLabel || centerSub) && (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
          {centerLabel && <div style={{ fontFamily: "var(--font-serif)", fontSize: "28px", lineHeight: 1, color: "oklch(0.18 0.018 75)" }}>{centerLabel}</div>}
          {centerSub && <div style={{ fontSize: "11px", color: "oklch(0.60 0.018 80)", marginTop: "3px", fontFamily: "var(--font-jetbrains-mono)" }}>{centerSub}</div>}
        </div>
      )}
    </div>
  );
}

/* ── Sparkline (inline mini chart) ── */
export function SparkLine({ data, color, width = 80, height = 32 }: { data: number[]; color?: string; width?: number; height?: number }) {
  const c = color ?? BRAND.yellow;
  if (!data.length) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 6) - 3;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <polyline points={pts} fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      {data.length > 0 && (() => {
        const last = data[data.length - 1];
        const x = width;
        const y = height - ((last - min) / range) * (height - 6) - 3;
        return <circle cx={x - 1} cy={y} r="2.5" fill={c} />;
      })()}
    </svg>
  );
}

/* ── Legend helper ── */
export function ChartLegend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "12px 20px", marginTop: "12px" }}>
      {items.map((item, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "oklch(0.50 0.02 80)", fontFamily: "var(--font-jetbrains-mono)" }}>
          <span style={{ width: "10px", height: "10px", borderRadius: "3px", background: item.color, display: "inline-block" }} />
          {item.label}
        </div>
      ))}
    </div>
  );
}
