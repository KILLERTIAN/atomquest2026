"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <>
      <style>{`
        .nf-bg {
          min-height: 100vh;
          background-color: var(--bg);
          background-image: radial-gradient(circle, oklch(0.72 0.180 75 / 0.11) 1.5px, transparent 1.5px);
          background-size: 28px 28px;
          display: flex;
          flex-direction: column;
          position: relative;
          overflow: hidden;
          font-family: var(--font-geist, sans-serif);
        }

        /* Scanning amber line */
        .nf-scan {
          position: absolute;
          left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent 5%, oklch(0.83 0.175 88 / 0.55) 40%, oklch(0.83 0.175 88 / 0.55) 60%, transparent 95%);
          pointer-events: none;
          animation: nf-scanline 5s ease-in-out infinite;
        }
        @keyframes nf-scanline {
          0%   { top: 0%; opacity: 0; }
          5%   { opacity: 1; }
          95%  { opacity: 0.4; }
          100% { top: 100%; opacity: 0; }
        }

        /* Corner L-brackets */
        .nf-c { position: fixed; width: 28px; height: 28px; }
        .nf-c::before, .nf-c::after {
          content: "";
          position: absolute;
          background: var(--brand);
          border-radius: 1px;
        }
        .nf-c::before { width: 100%; height: 2px; }
        .nf-c::after  { width: 2px; height: 100%; }
        .nf-tl { top: 20px; left: 20px; }
        .nf-tl::before { top: 0; left: 0; }
        .nf-tl::after  { top: 0; left: 0; }
        .nf-tr { top: 20px; right: 20px; }
        .nf-tr::before { top: 0; right: 0; }
        .nf-tr::after  { top: 0; right: 0; }
        .nf-bl { bottom: 20px; left: 20px; }
        .nf-bl::before { bottom: 0; left: 0; }
        .nf-bl::after  { bottom: 0; left: 0; }
        .nf-br { bottom: 20px; right: 20px; }
        .nf-br::before { bottom: 0; right: 0; }
        .nf-br::after  { bottom: 0; right: 0; }

        /* Atom orbital rings */
        .nf-orbit { position: absolute; inset: 6px; border-radius: 50%; }
        .nf-orbit-0 {
          border: 1.5px solid oklch(0.72 0.180 75 / 0.85);
          animation: nf-orb0 7s linear infinite;
        }
        .nf-orbit-1 {
          border: 1.5px solid oklch(0.72 0.180 75 / 0.55);
          animation: nf-orb1 10s linear infinite;
        }
        .nf-orbit-2 {
          border: 1.5px solid oklch(0.72 0.180 75 / 0.30);
          animation: nf-orb2 13s linear infinite;
        }
        @keyframes nf-orb0 {
          from { transform: rotateX(72deg) rotateZ(0deg);   }
          to   { transform: rotateX(72deg) rotateZ(360deg); }
        }
        @keyframes nf-orb1 {
          from { transform: rotateX(72deg) rotateZ(60deg);  }
          to   { transform: rotateX(72deg) rotateZ(420deg); }
        }
        @keyframes nf-orb2 {
          from { transform: rotateX(72deg) rotateZ(120deg); }
          to   { transform: rotateX(72deg) rotateZ(480deg); }
        }
        @keyframes nf-nucleus {
          0%, 100% { transform: scale(1);    box-shadow: 0 0 0 0 oklch(0.83 0.175 88 / 0.45), 0 0 18px oklch(0.83 0.175 88 / 0.4); }
          50%       { transform: scale(1.3); box-shadow: 0 0 0 7px oklch(0.83 0.175 88 / 0.0), 0 0 32px oklch(0.83 0.175 88 / 0.6); }
        }

        /* 404 glitch */
        .nf-404 {
          position: relative;
          font-family: var(--font-instrument-serif, serif);
          font-size: clamp(96px, 20vw, 164px);
          font-weight: 800;
          line-height: 0.88;
          letter-spacing: -0.05em;
          color: var(--ink);
          user-select: none;
          animation: nf-glitch-base 7s infinite;
        }
        .nf-404::before,
        .nf-404::after {
          content: "404";
          position: absolute;
          inset: 0;
          font-family: var(--font-instrument-serif, serif);
          font-weight: 800;
          font-size: inherit;
          line-height: 0.88;
          letter-spacing: -0.05em;
          opacity: 0;
        }
        .nf-404::before { color: var(--brand-deep); animation: nf-glitch-a 7s infinite; }
        .nf-404::after  { color: oklch(0.52 0.16 198); animation: nf-glitch-b 7s infinite; }

        @keyframes nf-glitch-base {
          0%, 88%, 100% { transform: none; }
          89% { transform: skewX(-3deg) translateX(3px); }
          90% { transform: none; }
          91% { transform: skewX(2deg) translateX(-2px); }
          92% { transform: none; }
        }
        @keyframes nf-glitch-a {
          0%, 88%, 100% { opacity: 0; }
          89% { opacity: 1; clip-path: inset(6% 0 64% 0);  transform: translate(-9px, 1px); }
          90% { opacity: 0; }
          91% { opacity: 1; clip-path: inset(58% 0 12% 0); transform: translate(-5px, -1px); }
          92% { opacity: 0; }
        }
        @keyframes nf-glitch-b {
          0%, 88%, 100% { opacity: 0; }
          89% { opacity: 1; clip-path: inset(32% 0 40% 0); transform: translate(9px, 0); }
          90% { opacity: 0; }
          91% { opacity: 1; clip-path: inset(64% 0 6% 0);  transform: translate(6px, 2px); }
          92% { opacity: 0; }
        }

        /* Entry animations */
        .nf-up { animation: nf-fade-up 0.65s cubic-bezier(0.22,1,0.36,1) both; }
        .nf-d1 { animation-delay: 0.05s; }
        .nf-d2 { animation-delay: 0.18s; }
        .nf-d3 { animation-delay: 0.32s; }
        .nf-d4 { animation-delay: 0.48s; }
        .nf-d5 { animation-delay: 0.60s; }
        @keyframes nf-fade-up {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: none; }
        }

        /* Blinking cursor in terminal */
        @keyframes nf-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
      `}</style>

      <div className="nf-bg">
        {/* Amber scanline */}
        <div className="nf-scan" />

        {/* Corner brackets */}
        <div className="nf-c nf-tl" />
        <div className="nf-c nf-tr" />
        <div className="nf-c nf-bl" />
        <div className="nf-c nf-br" />

        {/* Top bar */}
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, height: 48, zIndex: 10,
          borderBottom: "1px solid var(--line)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 56px",
          background: "color-mix(in oklch, var(--bg) 90%, transparent)",
          backdropFilter: "blur(10px)",
        }}>
          <span style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: 11.5, color: "var(--ink-mute)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
            AtomQuest
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "oklch(0.62 0.16 22)", display: "inline-block", animation: "nf-blink 2s ease-in-out infinite" }} />
            <span style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: 11, color: "oklch(0.62 0.16 22)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Signal lost
            </span>
          </div>
        </div>

        {/* Main content */}
        <div style={{
          flex: 1, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          padding: "104px 24px 72px", gap: 0,
        }}>

          {/* 3-ring atom */}
          <div className="nf-up" style={{
            position: "relative", width: 120, height: 120,
            perspective: "380px",
            marginBottom: 4, zIndex: 2,
          }}>
            <div className="nf-orbit nf-orbit-0" />
            <div className="nf-orbit nf-orbit-1" />
            <div className="nf-orbit nf-orbit-2" />
            {/* Nucleus */}
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{
                width: 13, height: 13, borderRadius: "50%",
                background: "var(--brand)",
                animation: "nf-nucleus 2.8s ease-in-out infinite",
              }} />
            </div>
          </div>

          {/* Glitch 404 */}
          <div className="nf-404 nf-up nf-d1">404</div>

          {/* Headline */}
          <h1 className="nf-up nf-d2" style={{
            fontSize: "clamp(18px, 3.5vw, 25px)", fontWeight: 600,
            color: "var(--ink)", margin: "22px 0 0",
            letterSpacing: "-0.03em", textAlign: "center",
            fontFamily: "var(--font-instrument-serif, serif)", fontStyle: "italic",
          }}>
            This orbit doesn&apos;t exist
          </h1>

          {/* Terminal block */}
          <div className="nf-up nf-d3" style={{
            fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 12,
            color: "var(--ink-mute)", textAlign: "left",
            maxWidth: 380, width: "100%", margin: "20px 0 36px",
            lineHeight: 2, padding: "16px 20px 14px",
            border: "1px solid var(--line)", borderRadius: 10,
            background: "var(--bg-elev)", position: "relative", overflow: "hidden",
          }}>
            {/* Accent top bar */}
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, height: 2,
              background: "linear-gradient(90deg, var(--brand-deep), var(--brand) 60%, transparent)",
            }} />
            {/* Traffic lights */}
            <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
              {["oklch(0.65 0.16 22)", "oklch(0.78 0.16 88)", "oklch(0.62 0.14 150)"].map((c, i) => (
                <span key={i} style={{ width: 9, height: 9, borderRadius: "50%", background: c, display: "inline-block" }} />
              ))}
            </div>
            <div><span style={{ color: "oklch(0.60 0.15 22)" }}>✗ ERR_404</span>{"  "}path could not be resolved</div>
            <div><span style={{ color: "var(--brand-deep)" }}>›</span>{"  "}resource may be moved or deleted</div>
            <div><span style={{ color: "var(--brand-deep)" }}>›</span>{"  "}check permissions or try again</div>
            <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6, opacity: 0.5 }}>
              <span>$</span>
              <span style={{ animation: "nf-blink 1.1s step-start infinite", borderRight: "1px solid var(--ink-mute)", paddingRight: 2 }}>&nbsp;</span>
            </div>
          </div>

          {/* CTA buttons */}
          <div className="nf-up nf-d4" style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
            <Link href="/" className="btn-primary" style={{ textDecoration: "none", fontSize: 13.5, padding: "9px 22px" }}>
              Return to base
            </Link>
            <button className="btn-ghost" style={{ fontSize: 13.5, padding: "9px 22px" }} onClick={() => window.history.back()}>
              Go back
            </button>
          </div>
        </div>

        {/* Bottom status bar */}
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0, height: 38, zIndex: 10,
          borderTop: "1px solid var(--line)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 56px",
          background: "color-mix(in oklch, var(--bg) 90%, transparent)",
          backdropFilter: "blur(10px)",
          fontFamily: "var(--font-jetbrains-mono, monospace)",
          fontSize: 10, color: "var(--ink-mute)", letterSpacing: "0.08em", textTransform: "uppercase",
        }}>
          <span>AtomQuest · 2026.Q2 · build a774</span>
          <span style={{ display: "flex", gap: 16 }}>
            <span>ERR_404_NOT_FOUND</span>
            <span style={{ color: "var(--line-strong)" }}>|</span>
            <span>HTTP 404</span>
          </span>
        </div>
      </div>
    </>
  );
}
