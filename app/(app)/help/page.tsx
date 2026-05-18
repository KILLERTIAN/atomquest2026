"use client";

import { useState } from "react";
import { Panel, PageHeader, Icon } from "@/components/app/ui";

const FAQS = [
  {
    q: "How do I create a goal sheet?",
    a: "Click 'New Goal Sheet' in the sidebar, then add up to 8 goals. Weightages must total exactly 100%. Submit when complete — your manager will review and approve.",
  },
  {
    q: "What happens after my manager approves my sheet?",
    a: "Your goals are locked. You can then enter quarterly achievements (actual values) for each goal. Scores are computed automatically based on the UoM formula.",
  },
  {
    q: "How are scores calculated?",
    a: "Scores use the formula based on UoM type: NUMERIC_MIN → min(actual/target, 1.5); NUMERIC_MAX → min(target/actual, 1.5); TIMELINE → 1.0 if completed on time else 0.0; ZERO → 1.0 if actual is 0 else 0.0.",
  },
  {
    q: "What is a shared goal?",
    a: "A shared goal is owned by one employee and shared to others. Recipients can adjust their weightage but cannot edit the title, target, or actual value — those sync from the primary owner.",
  },
  {
    q: "Why is my goal locked?",
    a: "Goals lock when your manager approves your sheet. Only an Admin can unlock goals. Contact your admin if you need to make changes after approval.",
  },
  {
    q: "When does the Q2 check-in window open?",
    a: "Check-in windows are configured by your Admin per cycle. Your manager will leave a comment documenting your mid-quarter discussion. You'll be notified when the window opens.",
  },
  {
    q: "What does the weighted score mean?",
    a: "Your weighted score is the sum of (goal score × weightage%) across all goals. A score of 1.0× means you hit every target exactly. Above 1.0× means you exceeded targets.",
  },
  {
    q: "How do I escalate a missed check-in?",
    a: "Escalations are automated — if a manager misses commenting on a team member's sheet within the window, it surfaces on the Admin escalation board automatically.",
  },
];

const SHORTCUTS = [
  { keys: ["⌘", "K"],         label: "Command palette" },
  { keys: ["G", "H"],         label: "Go to Home" },
  { keys: ["G", "G"],         label: "Go to Goals" },
  { keys: ["G", "A"],         label: "Go to Approvals" },
  { keys: ["Esc"],            label: "Close modal" },
  { keys: ["⌘", "Enter"],     label: "Submit / confirm" },
];

export default function HelpPage() {
  const [open, setOpen] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const filtered = FAQS.filter(
    (f) => !search || f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5 fade-up" style={{ maxWidth: "720px" }}>
      <PageHeader
        eyebrow="account · help"
        title="Help & shortcuts."
        lede="Answers to common questions and keyboard shortcuts to speed up your workflow."
      />

      {/* Search */}
      <div style={{ position: "relative" }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--ink-mute)", pointerEvents: "none" }}>
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
        </svg>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search help articles…"
          style={{
            width: "100%", paddingLeft: "42px", paddingRight: "16px", height: "44px",
            borderRadius: "12px", border: "1px solid var(--line-strong)",
            background: "var(--surface-card)", fontSize: "14px", color: "var(--ink)", outline: "none",
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = "var(--brand)"; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = "var(--line-strong)"; }}
        />
      </div>

      {/* FAQ accordion */}
      <Panel title="Frequently asked questions" sub={`${filtered.length} articles`}>
        <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
          {filtered.map((faq, i) => (
            <div key={i} style={{ borderBottom: i < filtered.length - 1 ? "1px solid var(--line)" : "none" }}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  width: "100%", padding: "14px 0", background: "none", border: "none",
                  cursor: "pointer", textAlign: "left", gap: "12px",
                }}
              >
                <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--ink)", flex: 1 }}>{faq.q}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  style={{ color: "var(--ink-mute)", flexShrink: 0, transform: open === i ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
              {open === i && (
                <p style={{ fontSize: "13.5px", color: "var(--ink-soft)", lineHeight: 1.7, paddingBottom: "14px", margin: 0 }}>{faq.a}</p>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <p style={{ padding: "24px 0", textAlign: "center", color: "var(--ink-mute)", fontSize: "13px", fontFamily: "var(--font-jetbrains-mono)" }}>
              No results for "{search}"
            </p>
          )}
        </div>
      </Panel>

      {/* Keyboard shortcuts */}
      <Panel title="Keyboard shortcuts" sub="Move faster without the mouse">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0" }}>
          {SHORTCUTS.map(({ keys, label }, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "11px 0", borderBottom: "1px solid var(--line)" }}>
              <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
                {keys.map((k) => (
                  <kbd key={k} style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: "11px", background: "var(--bg-elev)", border: "1px solid var(--line-strong)", color: "var(--ink)", padding: "2px 7px", borderRadius: "5px" }}>{k}</kbd>
                ))}
              </div>
              <span style={{ fontSize: "13px", color: "var(--ink-soft)" }}>{label}</span>
            </div>
          ))}
        </div>
      </Panel>

      {/* Contact */}
      <Panel title="Need more help?" sub="Reach the AtomQuest team">
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <a href="mailto:atomquest@atomberg.com"
            className="btn-secondary"
            style={{ textDecoration: "none", fontSize: "13.5px" }}>
            <Icon name="inbox" size={14} /> Email support
          </a>
          <button className="btn-ghost" onClick={() => window.open("https://github.com", "_blank")}>
            <Icon name="file" size={14} /> Documentation
          </button>
        </div>
      </Panel>
    </div>
  );
}
