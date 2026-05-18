"use client";

import { ReactNode, CSSProperties } from "react";

/* ─── Design tokens (shared constants) ─── */
const INPUT_BASE: CSSProperties = {
  width: "100%", padding: "9px 12px", borderRadius: "10px",
  border: "1px solid oklch(0.90 0.015 88)", background: "#fff",
  fontSize: "13.5px", color: "var(--ink)", outline: "none",
  fontFamily: "inherit", boxSizing: "border-box", transition: "border-color .15s, box-shadow .15s",
};
const FOCUS_IN  = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
  e.currentTarget.style.borderColor = "oklch(0.72 0.180 75)";
  e.currentTarget.style.boxShadow   = "0 0 0 3px oklch(0.96 0.10 90)";
};
const FOCUS_OUT = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
  e.currentTarget.style.borderColor = "oklch(0.90 0.015 88)";
  e.currentTarget.style.boxShadow   = "none";
};

/* ─── FieldLabel ─── */
export function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <div style={{ fontSize: "11px", fontFamily: "var(--font-jetbrains-mono)", textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--ink-mute)", marginBottom: "6px" }}>
      {children}
    </div>
  );
}

/* ─── FormField (label + input wrapper) ─── */
export function FormField({ label, children }: { label: string; children: ReactNode }) {
  return <div><FieldLabel>{label}</FieldLabel>{children}</div>;
}

/* ─── ThemedInput ─── */
export function ThemedInput({ style, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} style={{ ...INPUT_BASE, ...style }} onFocus={FOCUS_IN} onBlur={FOCUS_OUT} />;
}

/* ─── ThemedTextarea ─── */
export function ThemedTextarea({ style, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} style={{ ...INPUT_BASE, resize: "vertical", lineHeight: 1.6, ...style }} onFocus={FOCUS_IN} onBlur={FOCUS_OUT} />;
}

/* ─── ThemedSelect ─── */
export function ThemedSelect({ options, placeholder, style, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & {
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <select
      {...props}
      style={{
        ...INPUT_BASE, cursor: "pointer", appearance: "none",
        backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'><polyline points='6 9 12 15 18 9'/></svg>")`,
        backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", paddingRight: "36px",
        ...style,
      }}
      onFocus={FOCUS_IN}
      onBlur={FOCUS_OUT}
    >
      {placeholder && <option value="" disabled>{placeholder}</option>}
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

/* ─── Badge ─── */
type BadgeKind = "default" | "ok" | "warn" | "err" | "brand" | "mute";
export function Badge({ children, kind = "default" }: { children: ReactNode; kind?: BadgeKind }) {
  const map: Record<BadgeKind, CSSProperties> = {
    default: { background: "var(--bg-elev)", color: "var(--ink-mute)", border: "1px solid var(--line)" },
    ok:      { background: "oklch(0.93 0.10 142)", color: "oklch(0.38 0.14 142)" },
    warn:    { background: "oklch(0.96 0.07 92)",  color: "oklch(0.50 0.14 70)"  },
    err:     { background: "oklch(0.96 0.06 22)",  color: "oklch(0.50 0.14 22)"  },
    brand:   { background: "var(--brand-soft)",    color: "var(--brand-deep)"    },
    mute:    { background: "oklch(0.96 0.01 80)",  color: "var(--ink-mute)"      },
  };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 8px", borderRadius: "999px", fontSize: "11.5px", fontWeight: 600, fontFamily: "var(--font-jetbrains-mono)", ...map[kind] }}>
      {children}
    </span>
  );
}

/* ─── Spinner ─── */
export function Spinner({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
      style={{ animation: "spin 0.7s linear infinite" }}>
      <path d="M12 3a9 9 0 1 0 9 9" />
    </svg>
  );
}

/* ─── Loader — two counter-rotating arcs ─── */
export function Loader({ size = 52, label }: { size?: number; label?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
      <div style={{ position: "relative", width: size, height: size }}>
        {/* outer arc */}
        <svg width={size} height={size} viewBox="0 0 52 52" fill="none"
          style={{ position: "absolute", inset: 0, animation: "spin 1.1s linear infinite" }}>
          <circle cx="26" cy="26" r="23" stroke="var(--line)" strokeWidth="2.5" />
          <circle cx="26" cy="26" r="23" stroke="var(--brand)" strokeWidth="2.5"
            strokeLinecap="round" strokeDasharray="36 108" />
        </svg>
        {/* inner arc — opposite direction */}
        <svg width={size} height={size} viewBox="0 0 52 52" fill="none"
          style={{ position: "absolute", inset: 0, animation: "spin 0.85s linear infinite reverse" }}>
          <circle cx="26" cy="26" r="14" stroke="var(--line)" strokeWidth="2" />
          <circle cx="26" cy="26" r="14" stroke="var(--brand-deep)" strokeWidth="2"
            strokeLinecap="round" strokeDasharray="22 66" />
        </svg>
      </div>
      {label !== undefined && (
        <span style={{
          fontFamily: "var(--font-jetbrains-mono)",
          fontSize: 11, letterSpacing: "0.1em",
          textTransform: "uppercase", color: "var(--ink-mute)",
        }}>
          {label || "Loading"}
        </span>
      )}
    </div>
  );
}

/* ─── Skeleton (shimmer placeholder) ─── */
export function Skeleton({ width = "100%", height = 16, radius = 6, style }: {
  width?: number | string;
  height?: number | string;
  radius?: number;
  style?: CSSProperties;
}) {
  return (
    <div style={{
      width, height, borderRadius: radius,
      background: "linear-gradient(90deg, var(--bg-elev) 25%, var(--line) 50%, var(--bg-elev) 75%)",
      backgroundSize: "200% 100%",
      animation: "shimmer 1.6s ease-in-out infinite",
      flexShrink: 0,
      ...style,
    }} />
  );
}

/* ─── SkeletonCard (pre-composed card placeholder) ─── */
export function SkeletonCard({ rows = 3 }: { rows?: number }) {
  return (
    <div style={{
      border: "1px solid var(--line)", borderRadius: 12,
      padding: "20px 20px 18px",
      background: "var(--bg-elev)",
      display: "flex", flexDirection: "column", gap: 12,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
        <Skeleton width={36} height={36} radius={18} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 7 }}>
          <Skeleton height={13} width="55%" />
          <Skeleton height={11} width="35%" />
        </div>
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} height={12} width={i === rows - 1 ? "70%" : "100%"} />
      ))}
    </div>
  );
}

/* ─── EmptyState ─── */
export function EmptyState({ icon, title, body, action }: { icon?: ReactNode; title: string; body?: string; action?: ReactNode }) {
  return (
    <div style={{ padding: "48px 24px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
      {icon && (
        <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: "oklch(0.96 0.07 92)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-mute)" }}>
          {icon}
        </div>
      )}
      <div style={{ fontWeight: 600, fontSize: "15px" }}>{title}</div>
      {body && <div style={{ fontSize: "13px", color: "var(--ink-mute)", lineHeight: 1.6, maxWidth: "360px" }}>{body}</div>}
      {action}
    </div>
  );
}

/* ─── DataTable ─── */
interface ColDef<T> { key: string; header: string; width?: string; render: (row: T) => ReactNode; }
export function DataTable<T extends { id: string }>({ cols, rows }: { cols: ColDef<T>[]; rows: T[] }) {
  const colTemplate = cols.map((c) => c.width || "1fr").join(" ");
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: colTemplate, padding: "6px 20px", borderBottom: "1px solid var(--line)" }}>
        {cols.map((c) => (
          <div key={c.key} style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: "10.5px", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-mute)", padding: "4px 0" }}>
            {c.header}
          </div>
        ))}
      </div>
      {rows.map((row, i) => (
        <div key={row.id} style={{ display: "grid", gridTemplateColumns: colTemplate, padding: "12px 20px", borderBottom: i === rows.length - 1 ? "none" : "1px solid oklch(0.94 0.01 88)", alignItems: "center" }}>
          {cols.map((c) => <div key={c.key}>{c.render(row)}</div>)}
        </div>
      ))}
      {rows.length === 0 && (
        <div style={{ padding: "32px", textAlign: "center", color: "var(--ink-mute)", fontSize: "13px" }}>No data</div>
      )}
    </div>
  );
}

/* ─── Avatar ─── */
export function Avatar({ name, tone, size = 28 }: { name: string; tone?: string; size?: number }) {
  const initials = (name || "").split(" ").map((w) => w[0]).slice(0, 2).join("");
  return (
    <span
      className="rounded-full inline-flex items-center justify-center font-semibold flex-shrink-0"
      style={{
        width: size, height: size,
        background: tone || "var(--brand-soft)",
        fontSize: Math.max(10, size * 0.36),
        color: "var(--ink)",
      }}
    >
      {initials}
    </span>
  );
}

/* ─── Stat Card ─── */
interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  delta?: string;
  deltaKind?: "ok" | "warn" | "err" | "neutral";
  hint?: string;
  icon?: ReactNode;
}
export function StatCard({ label, value, unit, delta, deltaKind = "ok", hint, icon }: StatCardProps) {
  const deltaColors: Record<string, { color: string; bg: string }> = {
    ok:      { color: "var(--ok)",   bg: "var(--ok-soft)" },
    warn:    { color: "var(--warn)", bg: "var(--warn-soft)" },
    err:     { color: "var(--err)",  bg: "var(--err-soft)" },
    neutral: { color: "var(--ink-mute)", bg: "var(--bg-elev)" },
  };
  const dc = deltaColors[deltaKind];
  return (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-2">
        <span className="stat-lbl">{label}</span>
        {icon && <span style={{ color: "var(--brand-deep)", opacity: 0.7 }}>{icon}</span>}
      </div>
      <div className="stat-val">{value}<span className="stat-unit">{unit}</span></div>
      <div className="flex items-center gap-2 mt-2">
        {delta && <span className="text-xs font-medium px-1.5 py-0.5 rounded-full" style={{ color: dc.color, background: dc.bg }}>{delta}</span>}
        {hint && <span className="text-xs" style={{ color: "var(--ink-mute)" }}>{hint}</span>}
      </div>
    </div>
  );
}

/* ─── Panel (Section container) ─── */
interface PanelProps {
  title: string;
  sub?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
}
export function Panel({ title, sub, action, children, className = "", noPadding }: PanelProps) {
  return (
    <div className={"panel " + className}>
      <div className="panel-head">
        <div>
          <h3 className="panel-title">{title}</h3>
          {sub && <p className="panel-sub">{sub}</p>}
        </div>
        {action}
      </div>
      <div className={noPadding ? "" : "panel-body"}>{children}</div>
    </div>
  );
}

/* ─── Page Header ─── */
interface PageHeaderProps {
  eyebrow: string;
  title: string;
  lede?: string;
  actions?: ReactNode;
}
export function PageHeader({ eyebrow, title, lede, actions }: PageHeaderProps) {
  return (
    <div className="page-head">
      <div>
        <span className="page-eyebrow">{eyebrow}</span>
        <h1 className="page-title">{title}</h1>
        {lede && <p className="page-lede" dangerouslySetInnerHTML={{ __html: lede }} />}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}

/* ─── Weight Bar ─── */
export function WeightBar({ goals, className }: { goals: { weight: number; title: string; color?: string }[]; className?: string }) {
  const colors = [
    "oklch(0.92 0.13 92)", "oklch(0.88 0.12 86)", "oklch(0.84 0.11 80)",
    "oklch(0.80 0.10 74)", "oklch(0.76 0.09 68)", "oklch(0.72 0.08 62)",
    "oklch(0.68 0.07 56)", "oklch(0.64 0.06 50)",
  ];
  return (
    <div className={`weight-bar${className ? ` ${className}` : ""}`} style={{ height: "10px" }}>
      {goals.map((g, i) => (
        <div key={i} className="w-seg" style={{ flex: g.weight, background: g.color || colors[i % colors.length] }}>
          {g.weight >= 12 && <span>{g.weight}%</span>}
        </div>
      ))}
    </div>
  );
}

/* ─── Progress Ring ─── */
export function ProgressRing({ value, size = 60, stroke = 6, color = "var(--brand-deep)", label }: {
  value: number; size?: number; stroke?: number; color?: string; label?: string;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(value, 1));
  return (
    <svg width={size} height={size} className="ring-svg">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
        style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%", transition: "stroke-dashoffset 1s cubic-bezier(.2,.7,.2,1)" }} />
      <text x={size / 2} y={size / 2 + 1} textAnchor="middle" fontSize={size * 0.22}
        fontFamily="var(--font-instrument-serif)" fill="var(--ink)">
        {Math.round(value * 100)}
      </text>
      <text x={size / 2} y={size / 2 + size * 0.16} textAnchor="middle" fontSize={size * 0.12} fill="var(--ink-mute)">%</text>
    </svg>
  );
}

/* ─── Status Pill ─── */
type StatusKind = "approved" | "submitted" | "returned" | "draft" | "shared" | "ahead" | "on-track" | "behind";
export function StatusPill({ status }: { status: StatusKind }) {
  const map: Record<StatusKind, { label: string; cls: string }> = {
    approved:   { label: "Approved",   cls: "st-approved" },
    submitted:  { label: "Submitted",  cls: "st-submitted" },
    returned:   { label: "Returned",   cls: "st-returned" },
    draft:      { label: "Draft",      cls: "st-draft" },
    shared:     { label: "Shared",     cls: "shared" },
    ahead:      { label: "Ahead",      cls: "ahead" },
    "on-track": { label: "On track",   cls: "on-track" },
    behind:     { label: "Behind",     cls: "behind" },
  };
  const { label, cls } = map[status] || { label: status, cls: "st-draft" };
  return <span className={`pill ${cls}`}>{label}</span>;
}

/* ─── Activity Feed ─── */
interface FeedItem { dot?: "ok" | "warn" | "neutral"; content: ReactNode; }
export function ActivityFeed({ items }: { items: FeedItem[] }) {
  return (
    <ul className="feed">
      {items.map((item, i) => (
        <li key={i}>
          <span className={`dot ${item.dot || ""}`} />
          <div>{item.content}</div>
        </li>
      ))}
    </ul>
  );
}

/* ─── Filter Pills ─── */
export function FilterPills<T extends string>({ options, active, onChange }: {
  options: { label: string; value: T }[];
  active: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {options.map((o) => (
        <button key={o.value} onClick={() => onChange(o.value)}
          className="px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 border"
          style={{
            background: active === o.value ? "var(--brand-soft)" : "var(--surface-card)",
            color: active === o.value ? "var(--brand-deep)" : "var(--ink-mute)",
            borderColor: active === o.value ? "var(--brand-deep)" : "var(--line)",
            cursor: "pointer", fontFamily: "inherit",
          }}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ─── Quick Action Button ─── */
export function QuickAction({ icon, title, sub, onClick }: { icon: ReactNode; title: string; sub: string; onClick?: () => void }) {
  return (
    <button className="qa" onClick={onClick}>
      <span style={{ color: "var(--ink-mute)" }}>{icon}</span>
      <div>
        <b>{title}</b>
        <span>{sub}</span>
      </div>
      <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="var(--ink-mute)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="m9 6 6 6-6 6" />
      </svg>
    </button>
  );
}

/* ─── Section Label (for sub-headers) ─── */
export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.1em] mb-3" style={{ color: "var(--ink-mute)", fontFamily: "var(--font-jetbrains-mono)" }}>
      <span style={{ width: 20, height: 1, background: "var(--ink-mute)", display: "inline-block" }} />
      {children}
    </div>
  );
}

/* ─── Inline icon SVG paths ─── */
export function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const paths: Record<string, ReactNode> = {
    target:   <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.5" /></>,
    check:    <path d="M4 12.5 9 17.5 20 6.5" />,
    inbox:    <><path d="M3 13h5l2 3h4l2-3h5" /><path d="M5 5h14l2 8v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-6z" /></>,
    bar:      <><path d="M4 20V10" /><path d="M10 20V4" /><path d="M16 20v-7" /><path d="M22 20H2" /></>,
    users:    <><circle cx="9" cy="8" r="3.5" /><circle cx="17" cy="9" r="2.5" /><path d="M2 21c0-3.3 3.1-6 7-6s7 2.7 7 6" /><path d="M14.5 21c.2-2.5 2.3-4.5 5-4.5" /></>,
    download: <><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" /></>,
    filter:   <><path d="M4 4h16l-6 8v6l-4 2v-8z" /></>,
    spark:    <><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" /></>,
    sparkles: <><path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" /><path d="M19 14l1 2.5 2.5 1-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1z" /></>,
    clock:    <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    flag:     <><path d="M4 21V4h12l-2 4 2 4H4" /></>,
    arrow:    <path d="M5 12h14M13 6l6 6-6 6" />,
    chart:    <><path d="M3 3v18h18" /><path d="M7 14l3-3 3 3 5-5" /></>,
    plus:     <><path d="M12 5v14M5 12h14" /></>,
    chevron:  <path d="m9 6 6 6-6 6" />,
    file:     <><path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z" /><path d="M14 3v5h5" /></>,
    cycle:    <><path d="M21 12a9 9 0 1 1-3-6.7" /><path d="M21 4v5h-5" /></>,
    audit:    <><path d="M8 4h9l4 4v12a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" /><path d="M9 11h7M9 15h5" /></>,
    user:     <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-7 8-7s8 3 8 7" /></>,
    bell:     <><path d="M6 8a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9z" /><path d="M10 21a2 2 0 0 0 4 0" /></>,
    moon:     <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />,
    help:     <><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 2-2.5 2-2.5 4" /><circle cx="12" cy="17.5" r="0.5" fill="currentColor" stroke="none" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8L4.2 7a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3 1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></>,
    mail:     <><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m2 7 10 7 10-7" /></>,
    globe:    <><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></>,
    link:     <><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></>,
    pencil:   <><path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z" /></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {paths[name] || null}
    </svg>
  );
}
