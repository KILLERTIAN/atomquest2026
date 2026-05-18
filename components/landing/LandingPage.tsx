"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Onboarding } from "./Onboarding";

/* ── helpers ── */
function useScrollY() {
  const [y, setY] = useState(0);
  useEffect(() => {
    const onScroll = () => setY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return y;
}

function useSectionProgress(ref: React.RefObject<HTMLElement | null>) {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const rect = el.getBoundingClientRect();
      const p = Math.max(0, Math.min(1, -rect.top / (rect.height - window.innerHeight)));
      setProgress(p);
    };
    window.addEventListener("scroll", update, { passive: true });
    update();
    return () => window.removeEventListener("scroll", update);
  }, [ref]);
  return progress;
}

function useNow() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

/* Splits text into individual letter spans for reveal */
function SplitReveal({ text, delay = 0, className = "", tag: Tag = "span" as "span" | "h1" | "h2" | "h3" | "p" | "div" }: {
  text: string; delay?: number; className?: string; tag?: "span" | "h1" | "h2" | "h3" | "p" | "div";
}) {
  return (
    <Tag className={className} style={{ display: "block" }}>
      {text.split("").map((char, i) => (
        <span
          key={i}
          style={{
            display: "inline-block",
            opacity: 0,
            transform: "translateY(100%)",
            animation: `charReveal 0.7s cubic-bezier(0.16,1,0.3,1) forwards`,
            animationDelay: `${delay + i * 28}ms`,
          }}
        >
          {char === " " ? " " : char}
        </span>
      ))}
    </Tag>
  );
}

/* Word-by-word reveal for paragraphs */
function WordReveal({ text, delay = 0, style = {} }: { text: string; delay?: number; style?: React.CSSProperties }) {
  return (
    <span style={{ display: "inline", ...style }}>
      {text.split(" ").map((word, i) => (
        <span key={i} style={{ display: "inline-block", overflow: "hidden", verticalAlign: "bottom" }}>
          <span
            style={{
              display: "inline-block",
              opacity: 0,
              transform: "translateY(110%)",
              animation: `charReveal 0.65s cubic-bezier(0.16,1,0.3,1) forwards`,
              animationDelay: `${delay + i * 55}ms`,
              marginRight: "0.25em",
            }}
          >
            {word}
          </span>
        </span>
      ))}
    </span>
  );
}

/* ─── Hero dashboard card snapshots ─── */
const HERO_CARDS = [
  {
    label: "Q2 check-in · score live",
    pill: "1.18× avg",
    pillOk: true,
    content: (
      <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
        {/* Summary stat row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "8px", marginBottom: "16px" }}>
          {[["Sheet score", "1.18×", "oklch(0.72 0.14 150)"], ["Goals done", "3 / 4", "oklch(0.86 0.175 88)"], ["Q2 status", "On track", "oklch(0.72 0.14 150)"]].map(([l, v, c]) => (
            <div key={l as string} style={{ padding: "10px 12px", borderRadius: "10px", background: "oklch(0.975 0.012 90)", border: "1px solid oklch(0.91 0.012 88)" }}>
              <div style={{ fontSize: "10px", color: "oklch(0.58 0.018 80)", fontFamily: "var(--font-jetbrains-mono)", marginBottom: "4px" }}>{l}</div>
              <div style={{ fontSize: "17px", lineHeight: 1, fontFamily: "var(--font-instrument-serif)", color: c as string }}>{v}</div>
            </div>
          ))}
        </div>
        {/* Goal rows */}
        {[
          { t: "Launch silent-mode firmware v3", w: "25%", sc: "1.00", pct: 100, color: "oklch(0.72 0.14 150)", tag: "complete" },
          { t: "Reduce field RMA rate to <0.8%", w: "30%", sc: "1.13", pct: 78, color: "oklch(0.86 0.175 88)", tag: "ahead" },
          { t: "Cut BoM cost by 6% on Renesa-7", w: "20%", sc: "0.68", pct: 45, color: "oklch(0.78 0.15 55)", tag: "at risk" },
          { t: "NPS score ≥ 72 for Renesa line", w: "25%", sc: "—", pct: 0, color: "oklch(0.82 0.01 85)", tag: "pending" },
        ].map((g, i) => (
          <div key={i} style={{ padding: "10px 0", borderBottom: i < 3 ? "1px solid oklch(0.93 0.010 88)" : "none" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", alignItems: "baseline", gap: "8px" }}>
              <span style={{ fontSize: "12px", color: "oklch(0.28 0.018 75)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{g.t}</span>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                <span style={{ padding: "1px 6px", borderRadius: "4px", fontSize: "9.5px", fontFamily: "var(--font-jetbrains-mono)", background: g.tag === "complete" ? "oklch(0.94 0.06 150)" : g.tag === "ahead" ? "oklch(0.95 0.08 92)" : g.tag === "at risk" ? "oklch(0.95 0.06 50)" : "oklch(0.94 0.01 88)", color: g.tag === "complete" ? "oklch(0.40 0.12 150)" : g.tag === "ahead" ? "oklch(0.45 0.14 60)" : g.tag === "at risk" ? "oklch(0.45 0.13 50)" : "oklch(0.55 0.02 80)" }}>{g.tag}</span>
                <span style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: "14px", color: g.sc === "—" ? "oklch(0.70 0.01 80)" : "oklch(0.18 0.018 75)", lineHeight: 1, minWidth: "32px", textAlign: "right" }}>{g.sc}</span>
              </div>
            </div>
            <div style={{ height: "3px", background: "oklch(0.93 0.01 90)", borderRadius: "999px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${g.pct}%`, background: g.color, borderRadius: "999px", transition: "width 0.6s" }} />
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    label: "Team board · 5 direct reports",
    pill: "2 need you",
    pillWarn: true,
    content: (
      <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
        {/* Stat bar */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "6px", marginBottom: "16px" }}>
          {[["Approved", "2", "oklch(0.40 0.12 150)"], ["Submitted", "2", "oklch(0.45 0.14 60)"], ["Returned", "1", "oklch(0.45 0.13 50)"], ["Draft", "1", "oklch(0.50 0.02 80)"]].map(([l, v, c]) => (
            <div key={l as string} style={{ padding: "8px 10px", borderRadius: "8px", background: "oklch(0.975 0.012 90)", border: "1px solid oklch(0.91 0.012 88)", textAlign: "center" }}>
              <div style={{ fontSize: "18px", fontFamily: "var(--font-instrument-serif)", color: c as string, lineHeight: 1 }}>{v}</div>
              <div style={{ fontSize: "9.5px", color: "oklch(0.58 0.018 80)", fontFamily: "var(--font-jetbrains-mono)", marginTop: "3px" }}>{l}</div>
            </div>
          ))}
        </div>
        {/* People rows */}
        {[
          { n: "Anika S.", dept: "Firmware", s: "submitted", score: "1.12×", sc: { bg: "oklch(0.95 0.07 92)", c: "oklch(0.45 0.14 60)" } },
          { n: "Karan V.", dept: "Quality", s: "returned", score: "—", sc: { bg: "oklch(0.95 0.05 50)", c: "oklch(0.45 0.13 50)" } },
          { n: "Devika P.", dept: "Product", s: "approved", score: "1.04×", sc: { bg: "oklch(0.94 0.06 150)", c: "oklch(0.40 0.12 150)" } },
          { n: "Hiren T.", dept: "Hardware", s: "draft", score: "—", sc: { bg: "oklch(0.94 0.01 80)", c: "oklch(0.50 0.02 80)" } },
          { n: "Mira K.", dept: "Operations", s: "submitted", score: "0.92×", sc: { bg: "oklch(0.95 0.07 92)", c: "oklch(0.45 0.14 60)" } },
        ].map((r, i, arr) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "9px 0", borderBottom: i < arr.length - 1 ? "1px solid oklch(0.93 0.010 88)" : "none" }}>
            <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "oklch(0.91 0.09 88)", display: "grid", placeItems: "center", fontSize: "9.5px", fontWeight: 700, flexShrink: 0, color: "oklch(0.28 0.018 75)" }}>{r.n.split(" ").map((x: string) => x[0]).join("")}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "12.5px", fontWeight: 500, color: "oklch(0.22 0.018 75)", lineHeight: 1.2 }}>{r.n}</div>
              <div style={{ fontSize: "10.5px", color: "oklch(0.58 0.018 80)", fontFamily: "var(--font-jetbrains-mono)" }}>{r.dept}</div>
            </div>
            <span style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: "12px", color: "oklch(0.38 0.018 75)", minWidth: "36px", textAlign: "right" }}>{r.score}</span>
            <span style={{ padding: "2px 9px", borderRadius: "999px", fontSize: "10.5px", fontFamily: "var(--font-jetbrains-mono)", background: r.sc.bg, color: r.sc.c, flexShrink: 0 }}>{r.s}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    label: "Org analytics · FY 2026",
    pill: "live",
    pillOk: true,
    content: (
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {/* KPI row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "7px" }}>
          {[["On-track", "78%", "oklch(0.72 0.14 150)"], ["Avg score", "1.04×", "oklch(0.86 0.175 88)"], ["Submitted", "91%", "oklch(0.86 0.175 88)"], ["Mgr eff.", "92%", "oklch(0.72 0.14 150)"]].map(([l, v, c]) => (
            <div key={l as string} style={{ padding: "10px", border: "1px solid oklch(0.91 0.012 88)", borderRadius: "9px", background: "oklch(0.98 0.006 90)" }}>
              <div style={{ fontSize: "9.5px", color: "oklch(0.60 0.018 80)", fontFamily: "var(--font-jetbrains-mono)", marginBottom: "3px" }}>{l}</div>
              <div style={{ fontSize: "19px", lineHeight: 1.05, fontFamily: "var(--font-instrument-serif)", color: c as string }}>{v}</div>
            </div>
          ))}
        </div>
        {/* Dept score bars */}
        <div style={{ padding: "12px", border: "1px solid oklch(0.91 0.012 88)", borderRadius: "9px", background: "oklch(0.98 0.006 90)" }}>
          <div style={{ fontSize: "10px", color: "oklch(0.60 0.018 80)", fontFamily: "var(--font-jetbrains-mono)", marginBottom: "10px" }}>Avg score by department · Q2 2026</div>
          {[["Firmware", "1.18", 82], ["Quality", "1.04", 72], ["Product", "0.96", 67], ["Hardware", "0.88", 61], ["Operations", "1.12", 78]].map(([dept, sc, pct]) => (
            <div key={dept as string} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "7px" }}>
              <span style={{ fontSize: "11px", color: "oklch(0.35 0.018 75)", width: "72px", flexShrink: 0 }}>{dept}</span>
              <div style={{ flex: 1, height: "5px", background: "oklch(0.93 0.01 90)", borderRadius: "999px", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct}%`, background: Number(pct) >= 75 ? "oklch(0.72 0.14 150)" : Number(pct) >= 65 ? "oklch(0.86 0.175 88)" : "oklch(0.78 0.15 55)", borderRadius: "999px" }} />
              </div>
              <span style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: "11px", color: "oklch(0.38 0.018 75)", width: "32px", textAlign: "right" }}>{sc}×</span>
            </div>
          ))}
        </div>
        {/* Heatmap */}
        <div style={{ padding: "10px 12px", border: "1px solid oklch(0.91 0.012 88)", borderRadius: "9px", background: "oklch(0.98 0.006 90)" }}>
          <div style={{ fontSize: "10px", color: "oklch(0.60 0.018 80)", fontFamily: "var(--font-jetbrains-mono)", marginBottom: "6px" }}>Completion heatmap · 6 teams × 3 quarters</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: "4px" }}>
            {[0.9, 0.7, 0.5, 0.95, 0.85, 0.6, 0.88, 0.78, 0.65, 0.92, 0.7, 0.55, 0.95, 0.82, 0.7, 0.6, 0.88, 0.4].map((v, i) => (
              <div key={i} style={{ aspectRatio: "1.4", borderRadius: "4px", background: `oklch(${0.97 - v * 0.18} ${0.03 + v * 0.14} 92)` }} />
            ))}
          </div>
        </div>
      </div>
    ),
  },
  {
    label: "Goal sheet · weightage editor",
    pill: "100 / 100 ✓",
    pillOk: true,
    content: (
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {/* Stacked bar */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
            <span style={{ fontSize: "11px", color: "oklch(0.58 0.018 80)", fontFamily: "var(--font-jetbrains-mono)" }}>Weightage distribution</span>
            <span style={{ fontSize: "11px", fontFamily: "var(--font-jetbrains-mono)", color: "oklch(0.40 0.12 150)", fontWeight: 600 }}>100% ✓</span>
          </div>
          <div style={{ display: "flex", height: "36px", borderRadius: "8px", overflow: "hidden", border: "1px solid oklch(0.91 0.012 88)" }}>
            {[{ w: 25, c: "oklch(0.86 0.175 88)", l: "Firmware" }, { w: 20, c: "oklch(0.82 0.16 78)", l: "Quality" }, { w: 15, c: "oklch(0.78 0.16 70)", l: "Hiring" }, { w: 20, c: "oklch(0.72 0.165 60)", l: "Cost" }, { w: 10, c: "oklch(0.66 0.16 50)", l: "NPS" }, { w: 10, c: "oklch(0.60 0.15 40)", l: "Comms" }].map((s, i, arr) => (
              <div key={i} title={`${s.l}: ${s.w}%`} style={{ flex: s.w, display: "grid", placeItems: "center", fontSize: "9.5px", fontWeight: 700, background: s.c, borderRight: i < arr.length - 1 ? "1px solid oklch(1 0 0 / 0.20)" : "none", color: "oklch(0.18 0.018 75)" }}>{s.w}%</div>
            ))}
          </div>
        </div>
        {/* Goal rows */}
        {[
          { w: 25, l: "Launch silent-mode firmware v3", c: "oklch(0.86 0.175 88)", t: "target: ship by Q2", locked: true },
          { w: 20, l: "Reduce field RMA rate to <0.8%", c: "oklch(0.82 0.16 78)", t: "target: 0.8%", locked: true },
          { w: 15, l: "Hire 2 senior FW engineers", c: "oklch(0.78 0.16 70)", t: "target: 2 hires", locked: false },
          { w: 20, l: "Cut BoM cost by 6% on Renesa-7", c: "oklch(0.72 0.165 60)", t: "target: −6%", locked: true },
          { w: 10, l: "NPS score ≥ 72 for Renesa line", c: "oklch(0.66 0.16 50)", t: "target: 72", locked: false },
          { w: 10, l: "Internal comms cadence 4×/qtr", c: "oklch(0.60 0.15 40)", t: "target: 4", locked: false },
        ].map((g, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "7px 10px", borderRadius: "8px", background: "oklch(0.975 0.010 90)", border: "1px solid oklch(0.92 0.010 88)" }}>
            <div style={{ width: "3px", height: "28px", borderRadius: "2px", background: g.c, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "11.5px", color: "oklch(0.22 0.018 75)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.l}</div>
              <div style={{ fontSize: "10px", color: "oklch(0.58 0.018 80)", fontFamily: "var(--font-jetbrains-mono)" }}>{g.t}</div>
            </div>
            <span style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: "13px", fontWeight: 700, color: "oklch(0.30 0.018 75)", flexShrink: 0 }}>{g.w}%</span>
            {g.locked && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="oklch(0.58 0.018 80)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>}
          </div>
        ))}
      </div>
    ),
  },
];

function HeroCards({ ready }: { ready: boolean }) {
  const [idx, setIdx] = useState(0);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      setLeaving(true);
      setTimeout(() => {
        setIdx(i => (i + 1) % HERO_CARDS.length);
        setLeaving(false);
      }, 480);
    }, 4000);
    return () => clearInterval(id);
  }, []);

  /*
   * Layout: cards stacked like a physical deck peeking downward.
   * Card 0 = top/active  (full content, full opacity)
   * Card 1 = peeking 28px below  (no content, slightly smaller)
   * Card 2 = peeking 52px below  (no content, smaller still)
   *
   * Width is deliberately wider than the column so the right edge
   * gets hard-clipped by section overflow:hidden — like a screen
   * partially off-viewport.
   *
   * 16:9 ratio: width / height = 16/9  →  height = width * 9/16
   * We use a padding-bottom trick on the wrapper.
   */
  const PEEK_1 = 28;   // px card 1 peeks below card 0
  const PEEK_2 = 52;   // px card 2 peeks below card 0

  return (
    <div className="lp-orbit-wrap" style={{ position: "relative" }}>

      <style>{`
        @keyframes hc-exit { from { opacity:1; transform:translateY(0) scale(1); } to { opacity:0; transform:translateY(-60px) scale(0.96); } }
        @keyframes hc-enter { from { opacity:0; transform:translateY(20px) scale(0.98); } to { opacity:1; transform:translateY(0) scale(1); } }
        .hc-top-exit  { animation: hc-exit  0.44s cubic-bezier(0.4,0,1,1) forwards; }
        .hc-top-enter { animation: hc-enter 0.48s cubic-bezier(0.22,1,0.36,1) both; }
        .hc-ghost { transition: transform 0.44s cubic-bezier(0.22,1,0.36,1), opacity 0.3s ease; }
      `}</style>

      {/*
       * Outer wrapper: sets the 16:9 aspect ratio for the card area.
       * We make it wide enough to bleed — section has overflow:hidden.
       */}
      {/* Glow behind card stack */}
      <div aria-hidden style={{
        position: "absolute",
        top: "50%", left: "50%",
        transform: "translate(-50%, -44%)",
        width: "85%", height: "75%",
        background: "radial-gradient(ellipse at center, oklch(0.86 0.175 88 / 0.22) 0%, oklch(0.78 0.16 78 / 0.10) 45%, transparent 72%)",
        filter: "blur(28px)",
        pointerEvents: "none",
        zIndex: 1,
      }} />

      {/* Card stack: right edge intentionally bleeds ~60px past viewport — section clips it. lp-orbit-card-stack is targeted by mobile CSS to remove the bleed */}
      <div className="lp-orbit-card-stack" style={{ position: "relative", width: "calc(50vw + 60px)", maxWidth: "760px", aspectRatio: "16/9" }}>

        {/* Card 2 — furthest back, peeks at bottom */}
        <div className="hc-ghost" style={{
          position: "absolute", inset: 0,
          transform: leaving
            ? `translateY(${PEEK_1}px) scale(0.956)`
            : `translateY(${PEEK_2}px) scale(0.934)`,
          transformOrigin: "top center",
          opacity: leaving ? 1 : 0.78,
          zIndex: 10,
          borderRadius: "16px",
          background: "oklch(0.955 0.008 88)",
          border: "1px solid oklch(0.88 0.012 86)",
        }} />

        {/* Card 1 — middle, peeks just below active */}
        <div className="hc-ghost" style={{
          position: "absolute", inset: 0,
          transform: leaving
            ? `translateY(0px) scale(0.978)`
            : `translateY(${PEEK_1}px) scale(0.967)`,
          transformOrigin: "top center",
          opacity: 1,
          zIndex: 20,
          borderRadius: "16px",
          background: "oklch(0.975 0.006 90)",
          border: "1px solid oklch(0.89 0.012 87)",
          boxShadow: "0 4px 20px -8px oklch(0.4 0.04 80 / 0.12)",
        }}>
          {/* Show next card label as a subtle hint */}
          <div style={{ padding: "11px 16px", display: "flex", alignItems: "center", gap: "8px", opacity: 0.5 }}>
            <div style={{ display: "flex", gap: "4px" }}>
              {["oklch(0.78 0.13 30)", "oklch(0.85 0.13 90)", "oklch(0.78 0.13 145)"].map((c, i) => <span key={i} style={{ width: "8px", height: "8px", borderRadius: "50%", background: c, display: "inline-block" }} />)}
            </div>
            <span style={{ fontSize: "11.5px", color: "oklch(0.55 0.018 80)" }}>{HERO_CARDS[(idx + 1) % HERO_CARDS.length].label}</span>
          </div>
        </div>

        {/* Card 0 — active, on top */}
        <div
          key={idx}
          className={leaving ? "hc-top-exit" : "hc-top-enter"}
          style={{
            position: "absolute", inset: 0,
            zIndex: 30,
            borderRadius: "16px",
            background: "#fff",
            border: "1px solid oklch(0.90 0.012 88)",
            boxShadow: "0 2px 0 oklch(0.85 0.015 85), 0 16px 56px -16px oklch(0.4 0.04 80 / 0.20)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Window chrome */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "11px 16px", borderBottom: "1px solid oklch(0.91 0.012 88)", background: "oklch(0.985 0.006 90)", flexShrink: 0 }}>
            <div style={{ display: "flex", gap: "5px" }}>
              {["oklch(0.78 0.13 30)", "oklch(0.85 0.13 90)", "oklch(0.78 0.13 145)"].map((c, i) => <span key={i} style={{ width: "9px", height: "9px", borderRadius: "50%", background: c, display: "inline-block" }} />)}
            </div>
            <span style={{ flex: 1, fontSize: "12px", color: "oklch(0.50 0.018 80)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{HERO_CARDS[idx].label}</span>
            <span style={{
              padding: "3px 9px", borderRadius: "999px", fontSize: "10.5px", fontFamily: "var(--font-jetbrains-mono)", flexShrink: 0,
              background: HERO_CARDS[idx].pillOk ? "oklch(0.95 0.06 150)" : HERO_CARDS[idx].pillWarn ? "oklch(0.95 0.06 50)" : "oklch(0.96 0.01 90)",
              color: HERO_CARDS[idx].pillOk ? "oklch(0.40 0.12 150)" : HERO_CARDS[idx].pillWarn ? "oklch(0.45 0.13 50)" : "oklch(0.50 0.02 80)",
              border: `1px solid ${HERO_CARDS[idx].pillOk ? "oklch(0.85 0.07 150)" : HERO_CARDS[idx].pillWarn ? "oklch(0.85 0.09 65)" : "oklch(0.90 0.015 88)"}`,
            }}>{HERO_CARDS[idx].pill}</span>
          </div>
          <div style={{ flex: 1, padding: "14px 16px 16px", overflowY: "auto", overflowX: "hidden" }}>
            {HERO_CARDS[idx].content}
          </div>
        </div>

      </div>

      {/* Dot indicators */}
      {ready && (
        <div style={{ marginTop: `${PEEK_2 + 16}px`, display: "flex", gap: "7px" }}>
          {HERO_CARDS.map((_, i) => (
            <div key={i} style={{ width: i === idx ? "20px" : "6px", height: "6px", borderRadius: "999px", background: i === idx ? "oklch(0.86 0.175 88)" : "oklch(0.82 0.015 85)", transition: "all 0.35s cubic-bezier(0.16,1,0.3,1)" }} />
          ))}
        </div>
      )}
    </div>
  );
}

const STEPS = [
  { n: "01", label: "Draft", role: "Employee", color: "oklch(0.86 0.175 88)", bg: "oklch(0.92 0.12 90 / 0.15)", desc: "Write up to eight goals with precise targets and weights.", time: "~12 min" },
  { n: "02", label: "Approve", role: "Manager", color: "oklch(0.70 0.18 260)", bg: "oklch(0.88 0.12 260 / 0.12)", desc: "Review inline, return with notes, or lock for the quarter.", time: "~5 min" },
  { n: "03", label: "Check in", role: "Employee", color: "oklch(0.72 0.14 150)", bg: "oklch(0.88 0.12 150 / 0.12)", desc: "Log quarterly actuals. Four formulas compute the score live.", time: "~3 min" },
  { n: "04", label: "Report", role: "Admin", color: "oklch(0.74 0.18 30)", bg: "oklch(0.92 0.12 30 / 0.12)", desc: "Heatmaps, QoQ trends, manager effectiveness, one-click export.", time: "always-on" },
];

const STATS = [
  { value: "8", unit: "goals max", label: "per sheet" },
  { value: "100", unit: "%", label: "weight precision" },
  { value: "4", unit: "formulas", label: "auto-scoring" },
  { value: "3", unit: "roles", label: "one workflow" },
];

export function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const flowRef = useRef<HTMLElement | null>(null);
  const scrollY = useScrollY();
  const flowProgress = useSectionProgress(flowRef as React.RefObject<HTMLElement>);
  const now = useNow();

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 80);
    return () => clearTimeout(t);
  }, []);

  /* intersection observer for scroll reveals */
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("lp-visible"); io.unobserve(e.target); } }),
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    );
    document.querySelectorAll(".lp-scroll-reveal").forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);

  const navBg = scrollY > 20;
  const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  const dateStr = now.toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" });

  /* active step based on time of day (just for fun visual) */
  const hour = now.getHours();
  const activeStep = hour < 10 ? 0 : hour < 14 ? 1 : hour < 18 ? 2 : 3;

  return (
    <div style={{ minHeight: "100vh", overflowX: "hidden", background: "#f9f6ee", color: "oklch(0.18 0.018 75)", fontFamily: "var(--font-geist)" }}>

      {/* ── Global keyframes ── */}
      <style>{`
        @keyframes charReveal {
          from { opacity: 0; transform: translateY(100%); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes lineIn {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes nudge {
          0%,100% { transform: translateX(0); }
          50%      { transform: translateX(3px); }
        }
        @keyframes grain {
          0%,100% { transform: translate(0,0); }
          10%      { transform: translate(-1%,-1%); }
          20%      { transform: translate(1%,1%); }
          30%      { transform: translate(-1%,1%); }
          40%      { transform: translate(1%,-1%); }
          50%      { transform: translate(-1%,0); }
          60%      { transform: translate(0,1%); }
          70%      { transform: translate(1%,0); }
          80%      { transform: translate(0,-1%); }
          90%      { transform: translate(-1%,1%); }
        }
        @keyframes orbitSpin  { to { transform: rotate(360deg); } }
        @keyframes nucleusPulse {
          0%,100% { box-shadow: 0 0 0 1px oklch(0.72 0.17 70 / 0.4), 0 40px 90px -25px oklch(0.65 0.18 65 / 0.55), 0 8px 30px -8px oklch(0.85 0.16 90 / 0.7), inset 0 -14px 26px oklch(0.5 0.16 55 / 0.32), inset 0 14px 24px oklch(1 0 0 / 0.4); }
          50%      { box-shadow: 0 0 0 1px oklch(0.72 0.17 70 / 0.4), 0 50px 120px -25px oklch(0.65 0.18 65 / 0.75), 0 14px 44px -8px oklch(0.85 0.16 90 / 0.9), inset 0 -14px 26px oklch(0.5 0.16 55 / 0.32), inset 0 14px 24px oklch(1 0 0 / 0.4); }
        }
        @keyframes float1 { 0%,100% { transform: translateY(0) rotate(-1deg); }  50% { transform: translateY(-8px) rotate(0.5deg); } }
        @keyframes float2 { 0%,100% { transform: translateY(0) rotate(1deg); }   50% { transform: translateY(-10px) rotate(-0.5deg); } }
        @keyframes float3 { 0%,100% { transform: translateY(0) rotate(0deg); }   50% { transform: translateY(-6px) rotate(1deg); } }
        @keyframes float4 { 0%,100% { transform: translateY(0) rotate(-0.5deg); } 50% { transform: translateY(-9px) rotate(0.5deg); } }
        @keyframes marqueeScroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes pulse { 0% { box-shadow: 0 0 0 0 oklch(0.86 0.175 88 / 0.6); } 70% { box-shadow: 0 0 0 8px oklch(0.86 0.175 88 / 0); } 100% { box-shadow: 0 0 0 0 oklch(0.86 0.175 88 / 0); } }
        @keyframes countUp {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes borderPulse {
          0%,100% { border-color: oklch(0.86 0.175 88 / 0.5); }
          50%      { border-color: oklch(0.86 0.175 88); }
        }
        @keyframes dashMove {
          from { stroke-dashoffset: 200; }
          to { stroke-dashoffset: 0; }
        }

        /* Scroll reveal base */
        .lp-scroll-reveal {
          opacity: 0;
          transform: translateY(28px);
          transition: opacity 0.75s cubic-bezier(0.16,1,0.3,1), transform 0.75s cubic-bezier(0.16,1,0.3,1);
        }
        .lp-scroll-reveal.lp-visible {
          opacity: 1;
          transform: translateY(0);
        }

        /* staggered children */
        .lp-stagger > * { opacity: 0; transform: translateY(24px); transition: opacity 0.65s cubic-bezier(0.16,1,0.3,1), transform 0.65s cubic-bezier(0.16,1,0.3,1); }
        .lp-stagger.lp-visible > *:nth-child(1) { opacity:1; transform:none; transition-delay: 0.05s; }
        .lp-stagger.lp-visible > *:nth-child(2) { opacity:1; transform:none; transition-delay: 0.14s; }
        .lp-stagger.lp-visible > *:nth-child(3) { opacity:1; transform:none; transition-delay: 0.23s; }
        .lp-stagger.lp-visible > *:nth-child(4) { opacity:1; transform:none; transition-delay: 0.32s; }

        /* Nav links */
        .lp-nav-link { font-size: 13px; padding: 7px 11px; border-radius: 999px; color: oklch(0.40 0.020 75); text-decoration: none; transition: color .2s, background .2s; white-space: nowrap; }
        .lp-nav-link:hover { color: oklch(0.18 0.018 75); background: oklch(0.94 0.02 90); }

        /* Buttons */
        .lp-btn-primary { display: inline-flex; align-items: center; gap: 10px; font-weight: 500; border-radius: 999px; background: oklch(0.18 0.018 75); color: #f9f6ee; text-decoration: none; transition: transform .25s, box-shadow .25s; padding: 13px 24px; font-size: 14px; border: none; cursor: pointer; }
        .lp-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 36px -10px oklch(0.18 0.018 75 / 0.35); }
        
        .lp-btn-brand { display: inline-flex; align-items: center; gap: 10px; font-weight: 500; border-radius: 999px; background: oklch(0.86 0.175 88); color: oklch(0.18 0.018 75); box-shadow: 0 10px 36px -8px oklch(0.78 0.18 80 / 0.5); text-decoration: none; transition: transform .25s, box-shadow .25s; padding: 13px 24px; font-size: 14px; border: none; cursor: pointer; }
        .lp-btn-brand:hover { transform: translateY(-2px); box-shadow: 0 16px 48px -10px oklch(0.78 0.18 80 / 0.6); }
        .lp-btn-ghost { display: inline-flex; align-items: center; gap: 8px; font-weight: 500; border-radius: 999px; border: 1px solid oklch(0.84 0.020 85); color: oklch(0.28 0.018 75); text-decoration: none; transition: background .2s, border-color .2s; padding: 12px 22px; font-size: 14px; }
        .lp-btn-ghost:hover { background: oklch(0.95 0.018 90); border-color: oklch(0.78 0.020 85); }

        /* Flow cards */
        .lp-flow-card { border-radius: 20px; padding: 28px 24px; cursor: default; transition: transform 0.4s cubic-bezier(0.16,1,0.3,1), box-shadow 0.4s cubic-bezier(0.16,1,0.3,1), background 0.4s; }
        .lp-flow-card:hover { transform: translateY(-6px); }

        /* Pillars */
        .lp-pillar { padding: clamp(24px,3vw,40px) clamp(20px,2.5vw,32px) clamp(28px,4vw,40px); border-right: 1px solid oklch(0.90 0.015 88); transition: background 0.3s; }
        .lp-pillar:last-child { border-right: none; }
        .lp-pillar:hover { background: oklch(0.975 0.015 92); }

        /* Responsive */
        .lp-desktop-nav  { display: flex; }
        .lp-mobile-nav   { display: none; }
        .lp-hero-grid    { display: grid; grid-template-columns: 1.15fr 0.85fr; gap: clamp(40px,6vw,80px); align-items: start; }
        .lp-pillars-grid { display: grid; grid-template-columns: repeat(3,1fr); border-top: 1px solid oklch(0.90 0.015 88); }
        .lp-stats-grid   { display: grid; grid-template-columns: repeat(4,1fr); }
        .lp-flow-grid    { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; }
        .lp-footer-row   { display: flex; justify-content: space-between; align-items: flex-end; gap: 32px; flex-wrap: wrap; }

        /* Hero cards wrapper */
        .lp-hero-cards-wrap {
          display: flex; align-items: center;
          zIndex: 5;
        }

        @media (max-width: 1024px) {
          .lp-stats-grid { grid-template-columns: repeat(2,1fr); }
          .lp-flow-grid  { grid-template-columns: repeat(2,1fr); }
        }
        @media (max-width: 860px) {
          .lp-hero-grid  { grid-template-columns: 1fr; align-items: start; }
          .lp-hero-left  { padding-top: 0 !important; }
          .lp-orbit-wrap { width: 100% !important; }
          .lp-orbit-wrap > div { width: 100% !important; }
          .lp-pillars-grid { grid-template-columns: 1fr; }
          .lp-pillar { border-right: none !important; border-bottom: 1px solid oklch(0.90 0.015 88); }
          .lp-pillar:last-child { border-bottom: none; }
          .lp-footer-row { flex-direction: column; align-items: flex-start; gap: 24px; }
          .lp-gap-filler { display: none !important; }
        }
        @media (max-width: 720px) {
          .lp-desktop-nav { display: none !important; }
          .lp-mobile-nav  { display: block !important; }
          .lp-flow-grid   { grid-template-columns: 1fr; }
          .lp-stats-grid  { grid-template-columns: 1fr 1fr; }

          /* Hero mobile: single column, cards below text, centered */
          .lp-hero-section {
            grid-template-columns: 1fr !important;
            align-items: stretch !important;
            min-height: unset !important;
          }
          .lp-hero-text-wrap {
            padding-left: clamp(20px,5vw,40px) !important;
            padding-right: clamp(20px,5vw,40px) !important;
            padding-top: 90px !important;
            padding-bottom: 24px !important;
          }
          .lp-hero-cards-wrap {
            justify-content: center !important;
            align-items: flex-start !important;
            height: auto !important;
            padding-left: 16px !important;
            padding-bottom: 48px !important;
            overflow: hidden !important;
          }
          .lp-orbit-card-stack {
            width: min(520px, 92vw) !important;
            max-width: none !important;
          }
          .lp-hero-left { padding-top: 0 !important; }
          .lp-btn-primary, .lp-btn-brand, .lp-btn-ghost { width: 100%; justify-content: center; }
        }
        @media (max-width: 480px) {
          .lp-stats-grid { grid-template-columns: 1fr 1fr; }
          .lp-orbit-card-stack {
            width: min(400px, 94vw) !important;
          }
        }
      `}</style>

      {/* ── Grain overlay ── */}
      <div aria-hidden style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 1, opacity: 0.22, mixBlendMode: "multiply",
        backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.88' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.08 0 0 0 0 0.07 0 0 0 0 0.05 0 0 0 0.08 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`,
        animation: "grain 8s steps(10) infinite",
      }} />

      {/* ── NAV (desktop floating pill) ── */}
      <nav className="lp-desktop-nav" style={{
        position: "fixed", top: "14px", left: "50%", transform: "translateX(-50%)",
        zIndex: 50, alignItems: "center", gap: "4px",
        padding: "7px 7px 7px 16px",
        background: navBg ? "oklch(0.99 0.005 90 / 0.88)" : "oklch(0.99 0.005 90 / 0.70)",
        backdropFilter: "saturate(180%) blur(18px)",
        border: `1px solid ${navBg ? "oklch(0.86 0.02 90 / 0.7)" : "oklch(0.90 0.02 90 / 0.45)"}`,
        borderRadius: "999px",
        boxShadow: navBg ? "0 2px 0 oklch(0.82 0.02 85 / 0.5), 0 8px 24px oklch(0.4 0.04 80 / 0.10)" : "0 1px 0 oklch(0.85 0.02 85 / 0.3)",
        whiteSpace: "nowrap",
        transition: "background 0.4s, border-color 0.4s, box-shadow 0.4s",
      }}>
        <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} style={{ display: "flex", alignItems: "center", gap: "10px", paddingRight: "14px", marginRight: "4px", borderRight: "1px solid oklch(0.90 0.015 88)", background: "none", border: "none", cursor: "pointer", padding: "0 14px 0 0" }}>
          <Image src="/atomberg-logo.png" alt="Atomberg" width={26} height={26} style={{ borderRadius: "7px", boxShadow: "0 1px 0 oklch(0.7 0.16 75 / 0.3), 0 2px 4px oklch(0.6 0.16 60 / 0.18)", display: "block" }} />
          <span style={{ fontSize: "14px", fontWeight: 600, letterSpacing: "-0.015em", color: "oklch(0.18 0.018 75)" }}>AtomQuest</span>
        </button>
        <a href="#intro" className="lp-nav-link">Overview</a>
        <a href="#how" className="lp-nav-link">How it works</a>
        <a href="#onboarding" className="lp-nav-link">Onboarding</a>
        <Link href="/login" style={{
          fontSize: "13px", padding: "9px 16px", borderRadius: "999px",
          background: "oklch(0.136 0.022 72)", color: "#f9f6ee",
          fontWeight: 500, textDecoration: "none", transition: "background 0.2s",
        }}>
          Sign in
        </Link>
      </nav>

      {/* ── NAV (mobile) ── */}
      <nav className="lp-mobile-nav" style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        background: "oklch(0.99 0.005 90 / 0.95)", backdropFilter: "saturate(180%) blur(18px)",
        borderBottom: "1px solid oklch(0.90 0.015 88)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", height: "56px" }}>
          <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} style={{ display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            <Image src="/atomberg-logo.png" alt="Atomberg" width={24} height={24} style={{ borderRadius: "6px", display: "block" }} />
            <span style={{ fontSize: "14px", fontWeight: 600, letterSpacing: "-0.015em" }}>AtomQuest</span>
          </button>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <Link href="/login" style={{ fontSize: "13px", padding: "8px 14px", borderRadius: "999px", background: "oklch(0.136 0.022 72)", color: "#f9f6ee", fontWeight: 500, textDecoration: "none" }}>Sign in</Link>
            <button onClick={() => setMenuOpen(o => !o)} aria-label="Menu" style={{ width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "10px", background: "oklch(0.96 0.01 90)", border: "1px solid oklch(0.90 0.015 88)", cursor: "pointer" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                {menuOpen ? <path d="M18 6 6 18M6 6l12 12" /> : <path d="M3 6h18M3 12h18M3 18h18" />}
              </svg>
            </button>
          </div>
        </div>
        {menuOpen && (
          <div style={{ background: "#f9f6ee", borderTop: "1px solid oklch(0.92 0.012 88)" }}>
            {["#intro:Overview", "#how:How it works", "#onboarding:Onboarding"].map(item => {
              const [href, label] = item.split(":");
              return (
                <a key={href} href={href} onClick={() => setMenuOpen(false)} style={{ display: "block", padding: "16px 20px", fontSize: "15px", color: "oklch(0.40 0.020 75)", textDecoration: "none", borderBottom: "1px solid oklch(0.92 0.012 88)", transition: "background 0.15s" }}>
                  {label}
                </a>
              );
            })}
          </div>
        )}
      </nav>

      <main style={{ position: "relative", zIndex: 2 }}>

        {/* ══════════════════════════════════════════════════════
            HERO — minimal typography left + dashboard cards right (peeking)
        ══════════════════════════════════════════════════════ */}
        {/* Hero: full-width grid — text col left, cards col right (overflows viewport) */}
        <section className="lp-hero-section" style={{
          overflow: "hidden", position: "relative", minHeight: "100svh",
          display: "grid", gridTemplateColumns: "1fr 1fr", alignItems: "center",
        }}>

          {/* LEFT col — text */}
          <div className="lp-hero-text-wrap" style={{
            paddingLeft: "clamp(28px,5vw,80px)",
            paddingRight: "clamp(16px,2vw,32px)",
            paddingTop: "clamp(80px,10vw,120px)",
            paddingBottom: "clamp(40px,5vw,80px)",
            position: "relative", zIndex: 10,
          }}>
            <div className="lp-hero-left" style={{ display: "flex", flexDirection: "column" }}>

              {/* Badge */}
              <div style={{
                display: "inline-flex", alignItems: "center", gap: "9px",
                padding: "4px 14px 4px 6px", background: "oklch(1 0 0 / 0.7)",
                border: "1px solid oklch(0.88 0.015 88)", borderRadius: "999px",
                fontSize: "12px", color: "oklch(0.50 0.018 75)", marginBottom: "20px", width: "fit-content",
                opacity: ready ? 1 : 0, transform: ready ? "none" : "translateY(8px)",
                transition: "opacity 0.6s 0.05s, transform 0.6s 0.05s cubic-bezier(0.16,1,0.3,1)",
              }}>
                <Image src="/atomberg-logo.png" alt="" width={20} height={20} style={{ borderRadius: "5px", display: "block" }} />
                <span>Atomberg hackathon · <strong style={{ color: "oklch(0.18 0.018 75)" }}>2026 cycle</strong></span>
                {/* <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "oklch(0.72 0.14 150)", display: "inline-block", animation: "pulse 2s ease infinite" }} /> */}
              </div>

              {/* Headline — rendered as 2 lines instead of 4 */}
              {[
                { texts: ["Goals,", "tracked."], delay: 120, color: "oklch(0.14 0.018 75)", italic: false },
                { texts: ["Quarter,", "owned."], delay: 340, color: "oklch(0.74 0.175 80)", italic: true },
              ].map(({ texts, delay, color, italic }, gi) => (
                <h1 key={gi} style={{
                  fontFamily: "var(--font-instrument-serif)",
                  fontSize: "clamp(56px, 8vw, 104px)",
                  lineHeight: "1.05", letterSpacing: "-0.015em",
                  color, margin: 0, fontWeight: 400, fontStyle: italic ? "italic" : "normal",
                  paddingBottom: gi === 1 ? "0.15em" : "0.05em",
                  overflow: "hidden", whiteSpace: "nowrap"
                }}>
                  {texts.map((word, wi) => (
                    <span key={wi} style={{
                      display: "inline-block",
                      opacity: ready ? 1 : 0, transform: ready ? "none" : "translateY(108%)",
                      transition: `opacity 0.7s ${delay + wi * 80}ms cubic-bezier(0.16,1,0.3,1), transform 0.7s ${delay + wi * 80}ms cubic-bezier(0.16,1,0.3,1)`,
                      marginRight: wi < texts.length - 1 ? "0.25em" : "0",
                    }}>{word}</span>
                  ))}
                </h1>
              ))}

              {/* Gold rule */}
              <div style={{ height: "1px", background: "oklch(0.86 0.175 88)", marginTop: "18px", marginBottom: "14px", maxWidth: "220px", transformOrigin: "left", animation: ready ? "lineIn 0.9s 0.62s cubic-bezier(0.16,1,0.3,1) both" : "none" }} />

              {/* Sub-copy */}
              <p style={{ fontSize: "clamp(13px,1.1vw,15px)", lineHeight: 1.6, maxWidth: "36ch", color: "oklch(0.44 0.018 75)", margin: "0 0 24px", opacity: ready ? 1 : 0, transition: "opacity 0.7s 0.78s" }}>
                One workspace for goals, approvals, check-ins, and scoring — built for Atomberg.
              </p>

              {/* CTAs */}
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", opacity: ready ? 1 : 0, transition: "opacity 0.7s 0.92s" }}>
                <Link href="/login" className="lp-btn-brand">Open AtomQuest <ArrowRight size={16} /></Link>
                <a href="#intro" className="lp-btn-ghost">How it works</a>
              </div>

            </div>
          </div>

          {/* ── Decorative Gap Filler (Desktop only) ── */}
          <div className="lp-gap-filler" aria-hidden style={{
            position: "absolute", left: "47%", top: "50%", transform: "translate(-50%, -50%)",
            width: "340px", height: "400px", pointerEvents: "none", zIndex: 1
          }}>
            {/* Soft glowing ambient orb */}
            <div style={{
              position: "absolute", top: "10%", left: "0%", width: "240px", height: "240px",
              background: "radial-gradient(circle at center, oklch(0.86 0.175 88 / 0.18) 0%, transparent 65%)",
              filter: "blur(24px)", mixBlendMode: "multiply",
              animation: "pulse 4s ease-in-out infinite alternate"
            }} />

            {/* Connecting dashed path */}
            <svg style={{ position: "absolute", top: "30%", left: "-20%", width: "150%", height: "100%", overflow: "visible" }}>
              <path
                d="M -30 220 C 50 220, 100 -20, 320 60"
                fill="none" stroke="oklch(0.86 0.175 88 / 0.45)" strokeWidth="1.5" strokeDasharray="5 7"
                style={{
                  strokeDashoffset: 200,
                  animation: "dashMove 20s linear infinite"
                }}
              />
              <circle cx="-30" cy="220" r="3" fill="oklch(0.86 0.175 88)" opacity={0.6} />
              <circle cx="320" cy="60" r="3.5" fill="oklch(0.86 0.175 88)" />
            </svg>

          </div>

          {/* RIGHT col — cards, overflows right edge (section clips it) */}
          <div className="lp-hero-cards-wrap" style={{
            display: "flex", alignItems: "center", justifyContent: "flex-start",
            overflow: "hidden", height: "100%", paddingLeft: "clamp(16px,2vw,32px)", minWidth: 0,
          }}>
            <HeroCards ready={ready} />
          </div>

        </section>

        {/* ══════════════════════════════════════════════════════
            MARQUEE
        ══════════════════════════════════════════════════════ */}
        <div aria-hidden style={{ borderTop: "1px solid oklch(0.90 0.015 88)", borderBottom: "1px solid oklch(0.90 0.015 88)", background: "oklch(0.975 0.018 92)", overflow: "hidden" }}>
          <div style={{ display: "flex", padding: "16px 0", width: "max-content", animation: "marqueeScroll 36s linear infinite" }}>
            {Array(4).fill(null).map((_, ci) => (
              <div key={ci} style={{ display: "flex", alignItems: "center", gap: "48px", paddingRight: "48px", flexShrink: 0 }}>
                {["Set goals", "Align teams", "Check in quarterly", "Score automatically", "Report instantly", "OKR aligned org-wide"].map((item, i) => (
                  <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: "14px", fontSize: "11.5px", letterSpacing: "0.09em", textTransform: "uppercase", color: "oklch(0.55 0.018 80)", flexShrink: 0 }}>
                    {i % 2 === 1 && <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "oklch(0.86 0.175 88)", display: "inline-block" }} />}
                    {item}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════
            INTRO — scroll reveal text + pillars
        ══════════════════════════════════════════════════════ */}
        <section id="intro" style={{ maxWidth: "1240px", margin: "0 auto", padding: "clamp(72px,12vw,140px) clamp(20px,5vw,48px) clamp(48px,6vw,80px)" }}>

          {/* Eyebrow */}
          <div className="lp-scroll-reveal" style={{ display: "inline-flex", alignItems: "center", gap: "10px", fontFamily: "var(--font-jetbrains-mono)", fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase", color: "oklch(0.58 0.018 80)", marginBottom: "20px" }}>
            <span style={{ width: "28px", height: "1px", background: "oklch(0.58 0.018 80)", display: "inline-block" }} />
            What it is
          </div>

          {/* Section headline */}
          <div className="lp-scroll-reveal">
            <h2 style={{ fontFamily: "var(--font-instrument-serif)", fontSize: "clamp(38px, 6vw, 80px)", lineHeight: "0.97", letterSpacing: "-0.024em", maxWidth: "15ch", margin: "0 0 28px", fontWeight: 400 }}>
              A calmer way<br />
              to run <em style={{ fontStyle: "italic", color: "oklch(0.74 0.180 75)" }}>the&nbsp;quarter.</em>
            </h2>
          </div>

          <p className="lp-scroll-reveal" style={{ fontSize: "clamp(15px,1.9vw,18px)", lineHeight: "1.6", maxWidth: "620px", color: "oklch(0.42 0.020 75)", marginBottom: "72px" }}>
            AtomQuest replaces 11-tab spreadsheets with one opinionated workspace. Employees draft goals, managers approve them, admins keep the cycle in motion — all on the same timeline, with the same source of truth.
          </p>

          {/* Stats row */}
          <div className="lp-stats-grid lp-scroll-reveal lp-stagger" style={{ gap: "1px", background: "oklch(0.90 0.015 88)", border: "1px solid oklch(0.90 0.015 88)", borderRadius: "20px", overflow: "hidden", marginBottom: "72px" }}>
            {STATS.map(({ value, unit, label }) => (
              <div key={label} style={{ background: "#f9f6ee", padding: "clamp(20px,3vw,32px)", display: "flex", flexDirection: "column", gap: "4px" }}>
                <div style={{ fontFamily: "var(--font-instrument-serif)", fontSize: "clamp(40px,5vw,64px)", lineHeight: "1", letterSpacing: "-0.02em", color: "oklch(0.18 0.018 75)" }}>
                  {value}<span style={{ fontSize: "0.45em", verticalAlign: "super", color: "oklch(0.74 0.180 75)" }}>{unit}</span>
                </div>
                <div style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: "11px", letterSpacing: "0.08em", textTransform: "uppercase", color: "oklch(0.58 0.018 80)" }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Pillars */}
          <div className="lp-pillars-grid lp-scroll-reveal lp-stagger" style={{ borderRadius: "20px", overflow: "hidden", border: "1px solid oklch(0.90 0.015 88)" }}>
            {[
              { n: "01 / Define", icon: <><path d="M3 6h18M3 12h12M3 18h7" /></>, h: "Eight goals.\nOne hundred percent.", p: "A guided sheet enforces the rules so you can focus on the work — max 8 goals, weights must total 100, every target measurable." },
              { n: "02 / Align", icon: <><path d="M20 6 9 17l-5-5" /></>, h: "Approvals that\nactually approve.", p: "Managers review inline, return with a note, or lock the sheet. Shared KPIs cascade across the org without copy-paste." },
              { n: "03 / Score", icon: <><path d="M3 3v18h18" /><path d="M7 14l3-3 3 3 5-5" /></>, h: "Numbers in,\ninsight out.", p: "Quarterly actuals auto-score against four formulas. Admin sees QoQ trends, manager effectiveness, and a single export." },
            ].map((pillar, i) => (
              <div key={i} className="lp-pillar">
                <div style={{ width: "40px", height: "40px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", background: "oklch(0.96 0.080 90)", border: "1px solid oklch(0.88 0.07 92)", marginBottom: "20px" }}>
                  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="oklch(0.18 0.018 75)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{pillar.icon}</svg>
                </div>
                <span style={{ display: "block", fontSize: "11px", letterSpacing: "0.11em", color: "oklch(0.58 0.018 80)", fontFamily: "var(--font-jetbrains-mono)", marginBottom: "10px" }}>{pillar.n}</span>
                <h3 style={{ fontFamily: "var(--font-instrument-serif)", fontSize: "clamp(20px,2.2vw,28px)", lineHeight: "1.1", letterSpacing: "-0.012em", fontWeight: 400, margin: "0 0 12px" }}>
                  {pillar.h.split("\n").map((line, j) => <span key={j}>{line}{j < pillar.h.split("\n").length - 1 && <br />}</span>)}
                </h3>
                <p style={{ fontSize: "14px", lineHeight: "1.6", color: "oklch(0.42 0.020 75)", margin: 0 }}>{pillar.p}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            HOW IT WORKS — dark section with time-driven cards
        ══════════════════════════════════════════════════════ */}
        <section
          id="how"
          ref={flowRef as React.RefObject<HTMLDivElement>}
          style={{
            background: "oklch(0.136 0.022 72)",
            color: "#f9f6ee",
            padding: "clamp(64px,10vw,120px) clamp(20px,5vw,48px)",
            overflow: "hidden",
            position: "relative",
          }}
        >
          {/* Subtle radial glow at top */}
          <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: "60%", height: "40%", background: "radial-gradient(ellipse at top, oklch(0.86 0.175 88 / 0.08), transparent 70%)", pointerEvents: "none" }} />

          <div style={{ maxWidth: "1240px", margin: "0 auto", position: "relative" }}>

            {/* Header row */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "24px", marginBottom: "clamp(40px,6vw,64px)" }}>
              <div>
                <div className="lp-scroll-reveal" style={{ display: "inline-flex", alignItems: "center", gap: "10px", fontFamily: "var(--font-jetbrains-mono)", fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase", color: "oklch(0.65 0.04 80)", marginBottom: "16px" }}>
                  <span style={{ width: "28px", height: "1px", background: "oklch(0.65 0.04 80)", display: "inline-block" }} />
                  The cycle
                </div>
                <h2 className="lp-scroll-reveal" style={{ fontFamily: "var(--font-instrument-serif)", fontSize: "clamp(32px,5vw,60px)", lineHeight: "1.02", letterSpacing: "-0.02em", maxWidth: "16ch", fontWeight: 400, margin: 0 }}>
                  Four moves. <em style={{ color: "oklch(0.86 0.175 88)" }}>One quarter.</em><br />Everything stays in sync.
                </h2>
              </div>

              {/* Live clock — the anchor for time-based card highlight */}
              <div className="lp-scroll-reveal" style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: "clamp(28px,4vw,44px)", lineHeight: "1", letterSpacing: "-0.02em", color: "#f9f6ee", fontWeight: 400 }}>
                  {ready ? timeStr : ""}
                </div>
                <div style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: "oklch(0.65 0.04 80)", marginTop: "6px" }}>
                  {ready ? dateStr : ""} · active step below
                </div>
              </div>
            </div>

            {/* Cards grid — active card glows based on time of day */}
            <div className="lp-flow-grid lp-scroll-reveal lp-stagger">
              {STEPS.map((step, i) => {
                const isActive = i === activeStep;
                const scrollOffset = flowProgress * 24 * (i % 2 === 0 ? -1 : 1);
                return (
                  <div
                    key={i}
                    className="lp-flow-card"
                    style={{
                      background: isActive ? "oklch(0.21 0.018 72)" : "oklch(0.185 0.016 72)",
                      border: isActive ? "1px solid oklch(0.86 0.175 88 / 0.55)" : "1px solid oklch(0.28 0.012 75)",
                      transform: `translateY(${scrollOffset}px)`,
                      boxShadow: isActive ? `0 0 0 1px oklch(0.86 0.175 88 / 0.15), 0 20px 60px -20px oklch(0.86 0.175 88 / 0.2)` : "none",
                      animation: isActive ? "borderPulse 3s ease infinite" : "none",
                      willChange: "transform",
                      transition: "transform 0.1s linear, box-shadow 0.5s, background 0.5s, border-color 0.5s",
                    }}
                  >
                    {/* Step number + active badge */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                      <span style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: "11px", letterSpacing: "0.11em", color: step.color }}>
                        {step.n}
                      </span>
                      {isActive && (
                        <span style={{ display: "flex", alignItems: "center", gap: "5px", padding: "3px 9px", borderRadius: "999px", background: "oklch(0.86 0.175 88 / 0.15)", border: "1px solid oklch(0.86 0.175 88 / 0.35)", fontSize: "10.5px", color: "oklch(0.86 0.175 88)", fontFamily: "var(--font-jetbrains-mono)", letterSpacing: "0.06em" }}>
                          <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "oklch(0.86 0.175 88)", display: "inline-block", animation: "pulse 2s ease infinite" }} />
                          Now
                        </span>
                      )}
                    </div>

                    {/* Title + role */}
                    <h4 style={{ fontFamily: "var(--font-instrument-serif)", fontSize: "clamp(20px, 2.2vw, 26px)", lineHeight: "1.1", fontWeight: 400, margin: "0 0 4px", color: "#f9f6ee" }}>
                      {step.label}
                    </h4>
                    <div style={{ fontSize: "11.5px", color: "oklch(0.55 0.016 80)", fontFamily: "var(--font-jetbrains-mono)", letterSpacing: "0.05em", marginBottom: "14px" }}>
                      {step.role}
                    </div>

                    <p style={{ fontSize: "13.5px", lineHeight: "1.55", color: "oklch(0.68 0.016 80)", margin: "0 0 18px" }}>{step.desc}</p>

                    {/* Time badge */}
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "7px", padding: "5px 12px", borderRadius: "999px", background: "oklch(0.3 0.012 75)", fontSize: "11px", color: "oklch(0.80 0.02 80)", fontFamily: "var(--font-jetbrains-mono)" }}>
                      <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: step.color, display: "inline-block", flexShrink: 0 }} />
                      {step.time}
                    </div>

                    {/* Progress bar (fully filled if done, pulse if active, empty if future) */}
                    <div style={{ height: "2px", background: "oklch(0.25 0.012 75)", borderRadius: "999px", marginTop: "20px", overflow: "hidden" }}>
                      <div style={{
                        height: "100%", borderRadius: "999px",
                        background: step.color,
                        width: i < activeStep ? "100%" : isActive ? "60%" : "0%",
                        transition: "width 1.2s cubic-bezier(0.16,1,0.3,1)",
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* CTA below cards */}
            <div className="lp-scroll-reveal" style={{ marginTop: "48px", textAlign: "center" }}>
              <Link href="/login" className="lp-btn-brand" style={{ fontSize: "15px", padding: "15px 28px" }}>
                Start your cycle <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            ONBOARDING SECTION
        ══════════════════════════════════════════════════════ */}
        <Onboarding />

        {/* ══════════════════════════════════════════════════════
            FOOTER CTA — large cinematic close
        ══════════════════════════════════════════════════════ */}
        <footer style={{ maxWidth: "1240px", margin: "0 auto", padding: "clamp(80px,12vw,140px) clamp(20px,5vw,48px) clamp(48px,6vw,72px)" }}>

          {/* Large closing headline */}
          <div className="lp-scroll-reveal" style={{ marginBottom: "clamp(40px,6vw,80px)" }}>
            <h2 style={{ fontFamily: "var(--font-instrument-serif)", fontSize: "clamp(48px,8.5vw,128px)", lineHeight: "0.93", letterSpacing: "-0.028em", maxWidth: "14ch", margin: "0 0 32px", fontWeight: 400 }}>
              Set the spin.<br />
              <em style={{ fontStyle: "italic", color: "oklch(0.74 0.180 75)" }}>Track the gain.</em>
            </h2>
            <Link href="/login" className="lp-btn-primary" style={{ fontSize: "16px", padding: "16px 28px" }}>
              Pick your role <ArrowRight size={16} />
            </Link>
          </div>

          {/* Divider */}
          <div style={{ height: "1px", background: "oklch(0.90 0.015 88)", marginBottom: "28px" }} />

          {/* Footer meta */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", fontSize: "12px", color: "oklch(0.58 0.018 80)", fontFamily: "var(--font-jetbrains-mono)" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "10px" }}>
              <Image src="/atomberg-logo.png" alt="" width={20} height={20} style={{ borderRadius: "5px", display: "block" }} />
              AtomQuest · an Atomberg hackathon build
            </span>
            <span>v 2026.Q2 · built in 48h</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
