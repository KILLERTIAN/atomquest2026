"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

const ROLES = [
  {
    id: "employee",
    badge: "For individual contributors",
    title: "Employee",
    sub: "Draft, submit, and track your eight goals through the quarter.",
    accent: "oklch(0.88 0.165 92)",
    accentDeep: "oklch(0.72 0.165 60)",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/>
      </svg>
    ),
    steps: [
      { eyebrow: "Step 01", title: "Open your goal sheet", body: "A blank sheet appears the moment the cycle opens. Eight slots, no more. Drafts autosave — submit only when it feels right.", tip: "Hit ⌘K to jump back to a draft from anywhere.", ui: "sheet" },
      { eyebrow: "Step 02", title: "Hit one hundred", body: "Weight each goal by importance. The weight bar guides you — sheet locks for submission only when it sums to exactly 100%.", tip: "Minimum 10% per goal, so trivial work stays off the sheet.", ui: "weight" },
      { eyebrow: "Step 03", title: "Submit for approval", body: "Your manager gets a Teams ping and email. They can return with a note, or lock the sheet for the quarter.", tip: "Returned sheets keep their history. Nothing is rewritten silently.", ui: "submit" },
      { eyebrow: "Step 04", title: "Log quarterly actuals", body: "Every quarter, drop in actuals. Score is computed instantly — numeric-min, numeric-max, timeline, or zero formula, automatically.", tip: "The score caps at 1.5×. You can over-deliver, but not by infinity.", ui: "checkin" },
    ],
  },
  {
    id: "manager",
    badge: "For people leaders (L1)",
    title: "Manager",
    sub: "Review, align, and unblock — without becoming the spreadsheet.",
    accent: "oklch(0.82 0.16 78)",
    accentDeep: "oklch(0.62 0.16 50)",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="8" r="3.5"/><circle cx="17" cy="9" r="2.5"/>
        <path d="M2 21c0-3.3 3.1-6 7-6s7 2.7 7 6"/><path d="M14.5 21c.2-2.5 2.3-4.5 5-4.5"/>
      </svg>
    ),
    steps: [
      { eyebrow: "Step 01", title: "See the team at a glance", body: "A single board shows every direct report — draft, submitted, approved, returned. Sort by 'needs you' to clear blockers first.", tip: "Click any avatar to peek at their sheet inline.", ui: "team" },
      { eyebrow: "Step 02", title: "Approve, return, or edit inline", body: "Three buttons, no menu-diving. Return sends a structured note. Approve locks the sheet. Inline edits track who changed what.", tip: "Approvals are logged to the audit trail with one click.", ui: "approve" },
      { eyebrow: "Step 03", title: "Add quarterly check-in notes", body: "Drop structured comments per quarter — what worked, what shifted, what to watch. The employee sees them in their sheet.", tip: "Comments are quarter-scoped, not goal-scoped. Keeps the noise down.", ui: "comment" },
      { eyebrow: "Step 04", title: "Spot drift early", body: "A planned-vs-actual chart per goal flags drift before it becomes a problem. Click any row to drill into one employee.", tip: "Heatmap rows that turn amber are your next 1:1 agenda.", ui: "drift" },
    ],
  },
  {
    id: "admin",
    badge: "For HR & program ops",
    title: "Admin",
    sub: "Run the cycle, push shared KPIs, export the org — all from one console.",
    accent: "oklch(0.78 0.16 70)",
    accentDeep: "oklch(0.55 0.14 45)",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3h7v7H3zM14 3h7v4h-7zM14 11h7v10h-7zM3 14h7v7H3z"/>
      </svg>
    ),
    steps: [
      { eyebrow: "Step 01", title: "Open the cycle", body: "Set the dates per phase — draft, approval, Q1–Q4 check-ins, lock. Cycle automation handles reminders and escalations.", tip: "Daily 08:00 UTC cron sends nudges to anyone late.", ui: "cycle" },
      { eyebrow: "Step 02", title: "Manage users & teams", body: "Create accounts, assign managers and departments, push role changes. SSO via Microsoft Entra ID is one toggle.", tip: "Bulk import accepts a CSV — managers map by email.", ui: "users" },
      { eyebrow: "Step 03", title: "Push shared KPIs", body: "Some goals belong to many. Push a shared KPI to a list of employees; weight is editable per person, target stays in sync.", tip: "Achievements sync from the primary owner — no double entry.", ui: "shared" },
      { eyebrow: "Step 04", title: "See the whole org", body: "QoQ trends, completion heatmap, manager effectiveness, audit trail. Excel export rolls up every goal in the org.", tip: "Audit trail is paginated and searchable. Every mutation, every user.", ui: "org" },
    ],
  },
] as const;

type UiKey = "sheet"|"weight"|"submit"|"checkin"|"team"|"approve"|"comment"|"drift"|"cycle"|"users"|"shared"|"org";

const INTERVAL = 3800;

/* ─── Mock window chrome ─── */
function MockWindow({ title, pill, pillKind = "default", accent, children }: {
  title: string; pill: string; pillKind?: "default"|"ok"|"warn"; accent: string; children: React.ReactNode;
}) {
  const ps = pillKind === "ok"
    ? { background: "oklch(0.95 0.06 150)", color: "oklch(0.4 0.12 150)", border: "1px solid oklch(0.85 0.07 150)" }
    : pillKind === "warn"
    ? { background: "oklch(0.95 0.08 65)", color: "oklch(0.45 0.14 50)", border: "1px solid oklch(0.85 0.09 65)" }
    : { background: "oklch(0.96 0.01 90)", color: "oklch(0.50 0.02 80)", border: "1px solid var(--line)" };
  return (
    <div style={{ background: "var(--surface-card)", border: "1px solid var(--line)", borderRadius: "14px", overflow: "hidden", boxShadow: "0 20px 50px -25px oklch(0.4 0.04 80 / 0.25)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "12px 14px", borderBottom: "1px solid oklch(0.90 0.015 88)", background: `color-mix(in oklch, ${accent} 10%, #fff)` }}>
        <div style={{ display: "flex", gap: "6px" }}>
          {["oklch(0.78 0.13 30)","oklch(0.85 0.13 90)","oklch(0.78 0.13 145)"].map((c,i)=>(
            <span key={i} style={{ width:"10px", height:"10px", borderRadius:"50%", background:c, display:"inline-block" }}/>
          ))}
        </div>
        <span style={{ flex:1, fontSize:"12.5px", color:"oklch(0.50 0.02 80)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{title}</span>
        <span style={{ padding:"4px 9px", borderRadius:"999px", fontSize:"11px", fontFamily:"var(--font-jetbrains-mono)", letterSpacing:"0.04em", flexShrink:0, ...ps }}>{pill}</span>
      </div>
      <div style={{ padding:"18px 18px 20px" }}>{children}</div>
    </div>
  );
}

function GoalSheetMock({ accent }: { accent: string }) {
  const rows = [
    { t:"Launch silent-mode firmware v3", w:20 },
    { t:"Reduce field RMA rate to <0.8%", w:18 },
    { t:"Hire 2 senior FW engineers", w:12 },
    { t:"Cut BoM cost by 6% on Renesa-7", w:14 },
    { t:"Publish Q3 product playbook", w:8 },
  ];
  return (
    <MockWindow title="My goals · 2026 · Q2 draft" pill="Autosaved · 12s ago" accent={accent}>
      <div style={{ display:"grid", gridTemplateColumns:"32px 1fr 70px 80px", gap:"10px", padding:"8px 4px 10px", borderBottom:"1px solid oklch(0.90 0.015 88)", color:"oklch(0.58 0.018 80)", fontSize:"10.5px", fontFamily:"var(--font-jetbrains-mono)", letterSpacing:"0.08em", textTransform:"uppercase" }}>
        <span>#</span><span>Goal</span><span>Weight</span><span>Status</span>
      </div>
      {rows.map((r,i) => (
        <div key={i} style={{ display:"grid", gridTemplateColumns:"32px 1fr 70px 80px", gap:"10px", alignItems:"center", padding:"10px 4px", borderBottom:"1px dashed oklch(0.92 0.012 88)", fontSize:"12.5px" }}>
          <span style={{ fontFamily:"var(--font-jetbrains-mono)", color:"oklch(0.58 0.018 80)" }}>0{i+1}</span>
          <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{r.t}</span>
          <span style={{ fontWeight:600 }}>{r.w}%</span>
          <span><span style={{ padding:"2px 8px", borderRadius:"999px", fontSize:"10.5px", fontFamily:"var(--font-jetbrains-mono)", background:"oklch(0.95 0.01 80)", border:"1px solid var(--line)", color:"oklch(0.50 0.02 80)" }}>draft</span></span>
        </div>
      ))}
      <div style={{ display:"grid", gridTemplateColumns:"32px 1fr", gap:"10px", padding:"10px 4px", color:"oklch(0.60 0.018 80)", fontSize:"12.5px" }}>
        <span style={{ fontFamily:"var(--font-jetbrains-mono)" }}>06</span><span>+ Add goal</span>
      </div>
    </MockWindow>
  );
}

function WeightBarMock({ accent }: { accent: string }) {
  const segs = [
    { w:20, c:"oklch(0.88 0.165 92)" }, { w:18, c:"oklch(0.82 0.16 78)" },
    { w:12, c:"oklch(0.78 0.16 70)" }, { w:14, c:"oklch(0.72 0.165 60)" },
    { w:8,  c:"oklch(0.66 0.16 50)" }, { w:28, dashed:true },
  ];
  return (
    <MockWindow title="Weightage · target 100%" pill="72 / 100" accent={accent}>
      <div style={{ display:"flex", height:"52px", borderRadius:"10px", overflow:"hidden", border:"1px solid var(--line)" }}>
        {segs.map((s,i) => (
          <div key={i} style={{ flex:s.w, display:"grid", placeItems:"center", fontSize:"11px", fontWeight:600,
            background: s.dashed ? "repeating-linear-gradient(45deg,oklch(0.96 0.01 90) 0,oklch(0.96 0.01 90) 4px,transparent 4px,transparent 8px)" : s.c,
            borderRight: i < segs.length-1 ? "1px solid oklch(1 0 0 / 0.3)" : "none",
            color: s.dashed ? "oklch(0.60 0.02 80)" : "oklch(0.18 0.018 75)" }}>
            {s.w}%
          </div>
        ))}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"10px 18px", marginTop:"16px", fontSize:"12px", color:"oklch(0.50 0.02 80)" }}>
        {[["oklch(0.88 0.165 92)","Firmware"],["oklch(0.82 0.16 78)","Quality"],["oklch(0.78 0.16 70)","Hiring"],["oklch(0.72 0.165 60)","Cost"],["oklch(0.66 0.16 50)","Comms"]].map(([c,l]) => (
          <div key={l} style={{ display:"flex", alignItems:"center", gap:"8px" }}>
            <span style={{ width:"10px", height:"10px", borderRadius:"3px", background:c, display:"inline-block", flexShrink:0 }}/>{l}
          </div>
        ))}
        <div style={{ display:"flex", alignItems:"center", gap:"8px", color:"oklch(0.60 0.018 80)" }}>
          <span style={{ width:"10px", height:"10px", borderRadius:"3px", border:"1px dashed oklch(0.75 0.02 80)", display:"inline-block", flexShrink:0 }}/>Available 28%
        </div>
      </div>
      <div style={{ marginTop:"14px", paddingTop:"12px", borderTop:"1px solid oklch(0.90 0.015 88)", fontSize:"12px", color:"oklch(0.60 0.018 80)" }}>
        Every goal needs ≥ 10%. Sheet locks for submission only at exactly 100%.
      </div>
    </MockWindow>
  );
}

function SubmitMock({ accent }: { accent: string }) {
  return (
    <MockWindow title="Submit to Riya M. · L1" pill="Sheet · 5 goals" accent={accent}>
      {[
        { i:"AS", name:"Anika S.", email:"emp@demo", desc:"5 goals · weights total 100% · cycle Q2 2026", pill:"ready", pillBg:"oklch(0.96 0.07 92)", pillC:"oklch(0.55 0.14 60)", bg:"oklch(0.92 0.1 92)" },
        { i:"RM", name:"Riya M.",  email:"manager@demo", desc:"Teams + email notified · response ≈ same day", pill:"awaits", pillBg:"oklch(0.95 0.01 80)", pillC:"oklch(0.50 0.02 80)", bg:"oklch(0.92 0.06 60)" },
      ].map((r,idx) => (
        <div key={idx}>
          {idx > 0 && <div style={{ textAlign:"center", color:"oklch(0.60 0.018 80)", padding:"8px 0", fontSize:"14px" }}>↓</div>}
          <div style={{ display:"flex", alignItems:"center", gap:"12px", padding:"14px", border:"1px solid var(--line)", borderRadius:"12px" }}>
            <div style={{ width:"36px", height:"36px", borderRadius:"50%", display:"grid", placeItems:"center", fontSize:"11px", fontWeight:600, background:r.bg, border:"1px solid oklch(0.88 0.015 88)", flexShrink:0 }}>{r.i}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontWeight:500, fontSize:"13.5px" }}>{r.name} <span style={{ fontFamily:"var(--font-jetbrains-mono)", fontSize:"11px", color:"oklch(0.60 0.018 80)" }}>· {r.email}</span></div>
              <div style={{ fontSize:"11.5px", color:"oklch(0.60 0.018 80)", marginTop:"2px" }}>{r.desc}</div>
            </div>
            <span style={{ padding:"3px 9px", borderRadius:"999px", fontSize:"11px", fontFamily:"var(--font-jetbrains-mono)", background:r.pillBg, color:r.pillC, flexShrink:0 }}>{r.pill}</span>
          </div>
        </div>
      ))}
      <button style={{ marginTop:"16px", width:"100%", padding:"12px", borderRadius:"999px", background:"oklch(0.136 0.022 72)", color:"#fdfaf2", border:0, fontWeight:500, fontSize:"13.5px", cursor:"pointer" }}>
        Submit for approval
      </button>
    </MockWindow>
  );
}

function CheckinMock({ accent }: { accent: string }) {
  const goals = [
    { title:"Reduce RMA rate to < 0.8%", sub:"Numeric-min · target 0.80 · actual 0.71", score:"1.13", pct:75, amber:false },
    { title:"Launch silent-mode v3", sub:"Timeline · deadline Jun 30 · shipped Jun 21", score:"1.00", pct:100, amber:false },
    { title:"Cut BoM cost by 6%", sub:"Numeric-max · target 6% · actual 4.1%", score:"0.68", pct:45, amber:true },
  ];
  return (
    <MockWindow title="Q2 check-in · score live" pill="1.18×" pillKind="ok" accent={accent}>
      {goals.map((g,i) => (
        <div key={i}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:"12px", marginBottom:"6px" }}>
            <div style={{ minWidth:0 }}>
              <div style={{ fontWeight:500, fontSize:"13.5px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{g.title}</div>
              <div style={{ fontSize:"11.5px", color:"oklch(0.60 0.018 80)", marginTop:"2px" }}>{g.sub}</div>
            </div>
            <div style={{ textAlign:"right", flexShrink:0 }}>
              <span style={{ fontFamily:"var(--font-jetbrains-mono)", fontSize:"28px", lineHeight:1, color:"oklch(0.18 0.018 75)" }}>{g.score}</span>
              <span style={{ fontSize:"11px", color:"oklch(0.60 0.018 80)" }}> / 1.5</span>
            </div>
          </div>
          <div style={{ height:"5px", background:"oklch(0.94 0.01 90)", borderRadius:"999px", overflow:"hidden", marginBottom: i < goals.length-1 ? "18px" : 0 }}>
            <div style={{ height:"100%", width:`${g.pct}%`, background: g.amber ? "oklch(0.78 0.15 55)" : accent, borderRadius:"999px" }}/>
          </div>
        </div>
      ))}
    </MockWindow>
  );
}

function TeamMock({ accent }: { accent: string }) {
  const team = [
    { n:"Anika S.", s:"submitted", bg:"oklch(0.92 0.10 92)" },
    { n:"Karan V.", s:"returned",  bg:"oklch(0.92 0.06 60)" },
    { n:"Devika P.",s:"approved",  bg:"oklch(0.90 0.06 150)" },
    { n:"Hiren T.", s:"draft",     bg:"oklch(0.90 0.02 80)" },
    { n:"Mira K.",  s:"submitted", bg:"oklch(0.92 0.10 92)" },
  ];
  const sc: Record<string,{bg:string;color:string}> = {
    submitted:{bg:"oklch(0.96 0.07 92)",color:"oklch(0.45 0.14 60)"},
    returned: {bg:"oklch(0.95 0.06 50)",color:"oklch(0.45 0.13 50)"},
    approved: {bg:"oklch(0.95 0.06 150)",color:"oklch(0.40 0.12 150)"},
    draft:    {bg:"oklch(0.95 0.01 80)",color:"oklch(0.50 0.02 80)"},
  };
  return (
    <MockWindow title="Your team · 5 direct reports" pill="2 need you" pillKind="warn" accent={accent}>
      <div style={{ display:"grid", gridTemplateColumns:"1.8fr 1fr 0.8fr", gap:"10px", padding:"8px 4px 10px", borderBottom:"1px solid oklch(0.90 0.015 88)", color:"oklch(0.58 0.018 80)", fontSize:"10.5px", fontFamily:"var(--font-jetbrains-mono)", textTransform:"uppercase", letterSpacing:"0.08em" }}>
        <span>Person</span><span>Status</span><span>Action</span>
      </div>
      {team.map((t,i) => (
        <div key={i} style={{ display:"grid", gridTemplateColumns:"1.8fr 1fr 0.8fr", gap:"10px", alignItems:"center", padding:"10px 4px", borderBottom: i<team.length-1 ? "1px dashed oklch(0.92 0.012 88)" : "none", fontSize:"12.5px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"8px", minWidth:0 }}>
            <div style={{ width:"26px", height:"26px", borderRadius:"50%", background:t.bg, display:"grid", placeItems:"center", fontSize:"9px", fontWeight:600, border:"1px solid oklch(0.88 0.015 88)", flexShrink:0 }}>{t.n.split(" ").map(x=>x[0]).join("")}</div>
            <span style={{ fontWeight:500, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{t.n}</span>
          </div>
          <span style={{ padding:"2px 8px", borderRadius:"999px", fontSize:"10.5px", fontFamily:"var(--font-jetbrains-mono)", display:"inline-block", ...sc[t.s] }}>{t.s}</span>
          <button style={{ padding:"4px 9px", borderRadius:"999px", border:"1px solid oklch(0.88 0.02 85)", background:"transparent", fontSize:"11px", cursor:"pointer", color:"oklch(0.18 0.018 75)" }}>
            {t.s==="submitted" ? "Review" : t.s==="returned" ? "View" : t.s==="draft" ? "Nudge" : "Open"}
          </button>
        </div>
      ))}
    </MockWindow>
  );
}

function ApproveMock({ accent }: { accent: string }) {
  return (
    <MockWindow title="Reviewing · Anika S. · Q2 sheet" pill="5 goals · 100%" accent={accent}>
      {[
        { n:"01", title:"Launch silent-mode firmware v3", sub:"Timeline · target Jun 30 · w 20%", dot:"ok" },
        { n:"02", title:"Reduce field RMA rate to < 0.8%", sub:"Numeric-min · target 0.80 · w 18%", dot:"ok" },
        { n:"03", title:"Hire 3 senior FW engineers", sub:"Numeric-min · target 3 · w 12%", dot:"edit", edited:true },
      ].map((r,i) => (
        <div key={i} style={{ display:"grid", gridTemplateColumns:"30px 1fr 16px", gap:"10px", alignItems:"center", padding:"11px 4px", borderBottom:"1px dashed oklch(0.92 0.012 88)", background: r.edited ? `color-mix(in oklch, ${accent} 10%, transparent)` : "transparent", borderRadius: r.edited ? "8px" : 0, margin: r.edited ? "3px -8px" : 0, paddingLeft: r.edited ? "12px" : "4px" }}>
          <span style={{ fontFamily:"var(--font-jetbrains-mono)", fontSize:"11px", color:"oklch(0.60 0.018 80)" }}>{r.n}</span>
          <div style={{ minWidth:0 }}>
            <div style={{ fontWeight:500, fontSize:"13px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
              {r.title}
              {r.edited && <span style={{ fontSize:"10px", padding:"2px 6px", marginLeft:"6px", borderRadius:"999px", background:accent, color:"oklch(0.18 0.018 75)", fontFamily:"var(--font-jetbrains-mono)" }}>edited</span>}
            </div>
            <div style={{ fontSize:"11.5px", color:"oklch(0.60 0.018 80)", marginTop:"2px" }}>{r.sub}</div>
          </div>
          <div style={{ width:"8px", height:"8px", borderRadius:"50%", background: r.dot==="ok" ? "oklch(0.70 0.14 150)" : accent, justifySelf:"end", flexShrink:0 }}/>
        </div>
      ))}
      <div style={{ display:"flex", gap:"10px", justifyContent:"flex-end", marginTop:"16px", paddingTop:"12px", borderTop:"1px solid oklch(0.90 0.015 88)" }}>
        <button style={{ padding:"8px 14px", borderRadius:"999px", border:"1px solid oklch(0.82 0.020 85)", background:"transparent", fontSize:"12.5px", cursor:"pointer" }}>Return with note</button>
        <button style={{ padding:"8px 14px", borderRadius:"999px", border:0, background:"oklch(0.136 0.022 72)", color:"#fdfaf2", fontSize:"12.5px", cursor:"pointer" }}>Approve & lock</button>
      </div>
    </MockWindow>
  );
}

function CommentMock({ accent }: { accent: string }) {
  return (
    <MockWindow title="Q2 check-in note · Anika S." pill="Saved" pillKind="ok" accent={accent}>
      <div style={{ display:"flex", gap:"5px", padding:"4px", background:"oklch(0.96 0.01 90)", borderRadius:"999px", width:"fit-content", marginBottom:"14px" }}>
        {["Q1","Q2","Q3","Q4"].map((q,i) => (
          <span key={q} style={{ padding:"6px 13px", fontSize:"11.5px", borderRadius:"999px", fontFamily:"var(--font-jetbrains-mono)", background: i===1 ? "oklch(0.136 0.022 72)" : "transparent", color: i===1 ? "#fdfaf2" : "oklch(0.60 0.018 80)" }}>{q}</span>
        ))}
      </div>
      <div style={{ width:"100%", height:"100px", padding:"12px 14px", borderRadius:"10px", border:"1px solid var(--line)", background:"oklch(0.98 0.006 90)", fontSize:"13px", lineHeight:"1.55", color:"oklch(0.40 0.020 75)", overflow:"hidden" }}>
        RMA work is ahead of plan — Renesa-7 line is stable at 0.71. Re-scope the playbook goal: ship the field-tech section first.
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:"12px", gap:"10px" }}>
        <span style={{ fontSize:"11.5px", fontFamily:"var(--font-jetbrains-mono)", color:"oklch(0.60 0.018 80)" }}>scoped: Q2 · visible to employee</span>
        <button style={{ padding:"7px 14px", borderRadius:"999px", border:0, background:"oklch(0.136 0.022 72)", color:"#fdfaf2", fontSize:"12px", cursor:"pointer", flexShrink:0 }}>Save note</button>
      </div>
    </MockWindow>
  );
}

function DriftMock({ accent }: { accent: string }) {
  return (
    <MockWindow title="Planned vs actual · team Q2" pill="2 flagged" pillKind="warn" accent={accent}>
      <svg viewBox="0 0 300 130" width="100%" style={{ display:"block" }}>
        <defs>
          <linearGradient id="gradA" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor={accent} stopOpacity="0.45"/>
            <stop offset="1" stopColor={accent} stopOpacity="0"/>
          </linearGradient>
        </defs>
        {[0,1,2,3].map(i => <line key={i} x1="0" x2="300" y1={25+i*26} y2={25+i*26} stroke="oklch(0.90 0.015 88)" strokeDasharray="2 4"/>)}
        <polyline fill="none" stroke="oklch(0.78 0.02 80)" strokeWidth="1.5" strokeDasharray="5 4" points="10,85 65,72 120,60 175,46 230,33 290,20"/>
        <path d="M10,92 L65,76 L120,66 L175,56 L230,50 L290,40 L290,130 L10,130 Z" fill="url(#gradA)"/>
        <polyline fill="none" stroke="oklch(0.72 0.165 60)" strokeWidth="2" points="10,92 65,76 120,66 175,56 230,50 290,40"/>
        {[[10,92],[65,76],[120,66],[175,56],[230,50],[290,40]].map(([x,y],i) => (
          <circle key={i} cx={x} cy={y} r="3.5" fill="oklch(0.72 0.165 60)" stroke="#fdfaf2" strokeWidth="1.5"/>
        ))}
      </svg>
      <div style={{ display:"flex", gap:"18px", alignItems:"center", marginTop:"8px", fontSize:"12px", color:"oklch(0.50 0.02 80)" }}>
        <span style={{ display:"inline-flex", alignItems:"center", gap:"6px" }}><span style={{ width:"16px", borderTop:"1.5px dashed oklch(0.70 0.02 80)", display:"inline-block" }}/>Planned</span>
        <span style={{ display:"inline-flex", alignItems:"center", gap:"6px" }}><span style={{ width:"16px", borderTop:"2px solid oklch(0.72 0.165 60)", display:"inline-block" }}/>Actual</span>
      </div>
    </MockWindow>
  );
}

function CycleMock({ accent }: { accent: string }) {
  const phases = [
    { n:"Draft",    r:"Apr 1–14",  s:"done" },
    { n:"Approval", r:"Apr 15–22", s:"done" },
    { n:"Q1 check", r:"May 1–7",   s:"now"  },
    { n:"Q2 check", r:"Jul 1–7",   s:"next" },
    { n:"Lock",     r:"Mar 31 '27",s:"next" },
  ];
  return (
    <MockWindow title="Cycle · FY 2026" pill="automated" pillKind="ok" accent={accent}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:"6px" }}>
        {phases.map((p,i) => (
          <div key={i} style={{ padding:"12px 10px", borderRadius:"10px", border:`1px solid ${p.s==="done" ? "oklch(0.85 0.08 150)" : p.s==="now" ? accent : "oklch(0.90 0.015 88)"}`, background: p.s==="done" ? "color-mix(in oklch, oklch(0.7 0.14 150) 10%, #fff)" : p.s==="now" ? `color-mix(in oklch, ${accent} 20%, #fff)` : "oklch(0.98 0.006 90)" }}>
            <div style={{ width:"20px", height:"20px", borderRadius:"50%", display:"grid", placeItems:"center", fontSize:"10px", fontFamily:"var(--font-jetbrains-mono)", background: p.s==="done" ? "oklch(0.7 0.14 150)" : p.s==="now" ? "oklch(0.136 0.022 72)" : "oklch(0.94 0.01 90)", color: p.s!=="next" ? "#fff" : "oklch(0.60 0.018 80)", border: p.s==="next" ? "1px solid oklch(0.88 0.02 85)" : "none" }}>{i+1}</div>
            <div style={{ marginTop:"8px", fontSize:"12px", fontWeight:500 }}>{p.n}</div>
            <div style={{ fontSize:"10.5px", color:"oklch(0.60 0.018 80)", fontFamily:"var(--font-jetbrains-mono)", marginTop:"2px" }}>{p.r}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop:"12px", paddingTop:"10px", borderTop:"1px solid oklch(0.90 0.015 88)", display:"flex", justifyContent:"space-between", fontSize:"11.5px", color:"oklch(0.60 0.018 80)" }}>
        <span>Daily 08:00 UTC · escalation cron</span>
        <span style={{ fontFamily:"var(--font-jetbrains-mono)" }}>cron: 0 8 * * *</span>
      </div>
    </MockWindow>
  );
}

function UsersMock({ accent }: { accent: string }) {
  const users = [
    { n:"Karan V.",  e:"karan@atm",  d:"R&D",     m:"Riya M.",  r:"Employee" },
    { n:"Devika P.", e:"devika@atm", d:"Quality",  m:"Riya M.",  r:"Employee" },
    { n:"Riya M.",   e:"riya@atm",   d:"R&D",      m:"Vikas T.", r:"Manager"  },
    { n:"Anika S.",  e:"anika@atm",  d:"R&D",      m:"Riya M.",  r:"Employee" },
  ];
  return (
    <MockWindow title="Users · 482 active" pill="SSO: Entra ID" accent={accent}>
      <div style={{ display:"grid", gridTemplateColumns:"1.6fr 0.8fr 1fr 0.9fr", gap:"10px", padding:"8px 4px 10px", borderBottom:"1px solid oklch(0.90 0.015 88)", color:"oklch(0.58 0.018 80)", fontSize:"10px", fontFamily:"var(--font-jetbrains-mono)", textTransform:"uppercase", letterSpacing:"0.08em" }}>
        <span>Name</span><span>Dept</span><span>Manager</span><span>Role</span>
      </div>
      {users.map((u,i) => (
        <div key={i} style={{ display:"grid", gridTemplateColumns:"1.6fr 0.8fr 1fr 0.9fr", gap:"10px", alignItems:"center", padding:"9px 4px", borderBottom: i<users.length-1 ? "1px dashed oklch(0.92 0.012 88)" : "none", fontSize:"12px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"7px", minWidth:0 }}>
            <div style={{ width:"24px", height:"24px", borderRadius:"50%", background:"oklch(0.92 0.08 88)", display:"grid", placeItems:"center", fontSize:"9px", fontWeight:600, border:"1px solid oklch(0.88 0.015 88)", flexShrink:0 }}>{u.n.split(" ").map((x:string)=>x[0]).join("")}</div>
            <div style={{ minWidth:0 }}>
              <div style={{ fontWeight:500, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{u.n}</div>
              <div style={{ fontSize:"10px", color:"oklch(0.60 0.018 80)", fontFamily:"var(--font-jetbrains-mono)" }}>{u.e}</div>
            </div>
          </div>
          <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{u.d}</span>
          <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{u.m}</span>
          <span style={{ padding:"2px 7px", borderRadius:"999px", fontSize:"10px", fontFamily:"var(--font-jetbrains-mono)", background:"oklch(0.95 0.01 80)", border:"1px solid var(--line)", color:"oklch(0.50 0.02 80)", display:"inline-block" }}>{u.r}</span>
        </div>
      ))}
    </MockWindow>
  );
}

function SharedMock({ accent }: { accent: string }) {
  const names = ["Anika","Karan","Devika","Hiren","Mira","Sahil","Vikas","Rhea","Tara","Jay","Imran","Neel"];
  const weights = [8,6,8,6,5,8,12,6,5,6,7,8];
  return (
    <MockWindow title="Push shared KPI" pill="CSAT · org-wide" accent={accent}>
      <div style={{ padding:"12px 14px", background:`color-mix(in oklch, ${accent} 18%, #fff)`, borderRadius:"10px", border:`1px solid color-mix(in oklch, ${accent} 45%, oklch(0.90 0.015 88))`, marginBottom:"12px" }}>
        <div style={{ fontSize:"20px", lineHeight:1.1, fontFamily:"var(--font-instrument-serif)" }}>Lift product CSAT to 4.6</div>
        <div style={{ fontSize:"11.5px", color:"oklch(0.60 0.018 80)", marginTop:"4px" }}>Numeric-min · target 4.6 · primary: Vikas T.</div>
      </div>
      <div style={{ display:"flex", flexWrap:"wrap", gap:"5px" }}>
        {names.map((p,i) => (
          <span key={i} style={{ display:"inline-flex", alignItems:"center", gap:"5px", padding:"4px 9px 4px 4px", borderRadius:"999px", background:"oklch(0.97 0.008 90)", border:"1px solid var(--line)", fontSize:"11.5px" }}>
            <div style={{ width:"16px", height:"16px", borderRadius:"50%", background:"oklch(0.92 0.08 88)", display:"grid", placeItems:"center", fontSize:"8px", fontWeight:600, flexShrink:0 }}>{p[0]}</div>
            {p}<span style={{ fontSize:"10px", fontFamily:"var(--font-jetbrains-mono)", color:"oklch(0.60 0.018 80)" }}>{weights[i]}%</span>
          </span>
        ))}
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:"14px", paddingTop:"12px", borderTop:"1px solid oklch(0.90 0.015 88)", gap:"10px", flexWrap:"wrap" }}>
        <span style={{ fontSize:"11.5px", color:"oklch(0.60 0.018 80)" }}>Recipients can adjust weight; target stays synced.</span>
        <button style={{ padding:"7px 12px", borderRadius:"999px", border:0, background:"oklch(0.136 0.022 72)", color:"#fdfaf2", fontSize:"12px", cursor:"pointer", flexShrink:0 }}>Push to 12</button>
      </div>
    </MockWindow>
  );
}

function OrgMock({ accent }: { accent: string }) {
  const vals = [0.9,0.7,0.5,0.95,0.85,0.6,0.88,0.78,0.65,0.92,0.7,0.55,0.55,0.92,0.7,0.6,0.8,0.4,0.95,0.5,0.6,0.78,0.92,0.7];
  return (
    <MockWindow title="Org analytics · FY 2026" pill="live" pillKind="ok" accent={accent}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"8px", marginBottom:"14px" }}>
        {[["On-track","78%"],["Avg score","1.04×"],["Mgr eff.","92%"]].map(([l,v]) => (
          <div key={l} style={{ padding:"12px", border:"1px solid var(--line)", borderRadius:"10px", background:"oklch(0.98 0.006 90)" }}>
            <div style={{ fontSize:"10.5px", color:"oklch(0.60 0.018 80)", fontFamily:"var(--font-jetbrains-mono)" }}>{l}</div>
            <div style={{ fontSize:"28px", lineHeight:1, fontFamily:"var(--font-instrument-serif)", margin:"6px 0 3px" }}>{v}</div>
            <div style={{ fontSize:"10px", color:"oklch(0.60 0.018 80)" }}>+6 vs Q1</div>
          </div>
        ))}
      </div>
      <div style={{ padding:"12px", border:"1px solid var(--line)", borderRadius:"10px", background:"oklch(0.98 0.006 90)" }}>
        <div style={{ fontSize:"10.5px", color:"oklch(0.60 0.018 80)", fontFamily:"var(--font-jetbrains-mono)", marginBottom:"8px" }}>Completion heatmap · 6 teams × Q1–Q4</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"3px" }}>
          {vals.map((v,i) => <div key={i} style={{ aspectRatio:"2.4/1", borderRadius:"4px", background:`oklch(${0.96-v*0.15} ${0.04+v*0.13} 92)` }}/>)}
        </div>
      </div>
    </MockWindow>
  );
}

const UI_MAP: Record<UiKey, React.ComponentType<{accent:string}>> = {
  sheet:GoalSheetMock, weight:WeightBarMock, submit:SubmitMock, checkin:CheckinMock,
  team:TeamMock, approve:ApproveMock, comment:CommentMock, drift:DriftMock,
  cycle:CycleMock, users:UsersMock, shared:SharedMock, org:OrgMock,
};

/* ─── Main export ─── */
export function Onboarding() {
  const [roleIdx, setRoleIdx] = useState(0);
  const [stepIdx, setStepIdx] = useState(0);
  const [paused, setPaused] = useState(true); // true until in-viewport
  const [slideDir, setSlideDir] = useState<1|-1>(1);
  const [tick, setTick] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);

  const inViewRef = useRef(false);

  const role = ROLES[roleIdx];
  const step = role.steps[stepIdx];
  const UiMock = UI_MAP[step.ui as UiKey];

  const resume = useCallback(() => {
    if (inViewRef.current) setPaused(false);
  }, []);

  // Autoplay starts once section is 25% visible
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          inViewRef.current = true;
          resume();
          io.disconnect();
        }
      },
      { threshold: 0.25 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [resume]);

  const goTo = useCallback((ri: number, si: number, dir: 1|-1 = 1) => {
    setSlideDir(dir);
    setRoleIdx(ri);
    setStepIdx(si);
    setTick(t => t + 1);
  }, []);


  // Auto-advance — ref so closure always sees latest indices
  const stateRef = useRef({ roleIdx, stepIdx });
  useEffect(() => { stateRef.current = { roleIdx, stepIdx }; }, [roleIdx, stepIdx]);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      const { roleIdx: ri, stepIdx: si } = stateRef.current;
      const steps = ROLES[ri].steps.length;
      setSlideDir(1);
      setTick(t => t + 1);
      if (si < steps - 1) {
        setStepIdx(si + 1);
      } else {
        setRoleIdx((ri + 1) % ROLES.length);
        setStepIdx(0);
      }
    }, INTERVAL);
    return () => clearInterval(id);
  }, [paused]);

  return (
    <section
      id="onboarding"
      ref={sectionRef}
      className="lp-scroll-reveal"
      style={{ padding: "clamp(60px,10vw,112px) clamp(20px,5vw,32px)", maxWidth: "1240px", margin: "0 auto" }}
    >
      <style>{`
        @keyframes ob-slideInR { from { opacity:0; transform:translateX(32px) scale(0.985); } to { opacity:1; transform:translateX(0) scale(1); } }
        @keyframes ob-slideInL { from { opacity:0; transform:translateX(-32px) scale(0.985); } to { opacity:1; transform:translateX(0) scale(1); } }
        @keyframes ob-barFill  { from { transform:scaleX(0); } to { transform:scaleX(1); } }
        @keyframes ob-fadeIn   { from { opacity:0; } to { opacity:1; } }
        .ob-role-card { all:unset; cursor:pointer; position:relative; padding:clamp(18px,3vw,26px); border:1px solid oklch(0.90 0.015 88); border-radius:22px; background:oklch(0.97 0.012 90); overflow:hidden; display:block; text-align:left; transition:transform .35s cubic-bezier(.2,.7,.2,1), box-shadow .35s, border-color .25s, background .35s; }
        .ob-role-card:hover { transform:translateY(-3px); border-color:oklch(0.82 0.020 85); }
        .ob-role-card.active { background:#fff; }
      `}</style>

      {/* Header */}
      <div className="inline-flex items-center gap-2 mb-4" style={{ color:"oklch(0.58 0.018 80)", fontFamily:"var(--font-jetbrains-mono)", fontSize:"11.5px", textTransform:"uppercase", letterSpacing:"0.12em" }}>
        <span style={{ width:"24px", height:"1px", background:"oklch(0.58 0.018 80)", display:"inline-block" }}/>
        Onboarding
      </div>
      <h2 style={{ fontFamily:"var(--font-instrument-serif)", fontSize:"clamp(36px,5.6vw,76px)", lineHeight:1, letterSpacing:"-0.022em", maxWidth:"14ch", margin:"14px 0 0", fontWeight:400 }}>
        Pick the seat<br/>that <em style={{ fontStyle:"italic", color:"oklch(0.74 0.180 75)" }}>fits&nbsp;you.</em>
      </h2>
      <p style={{ fontSize:"clamp(15px,2vw,18px)", lineHeight:"1.55", maxWidth:"600px", marginTop:"28px", color:"oklch(0.40 0.020 75)" }}>
        Three doors into the same product. Each one tuned to how you actually work — without hiding what the others see.
      </p>

      {/* Role cards grid */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap:"14px", marginTop:"56px" }}>
        {ROLES.map((r, i) => {
          const active = i === roleIdx;
          return (
            <button
              key={r.id}
              className={`ob-role-card${active ? " active" : ""}`}
              onClick={() => goTo(i, 0)}
              style={{
                border: `1px solid ${active ? r.accent : "oklch(0.90 0.015 88)"}`,
                boxShadow: active ? `0 18px 50px -18px color-mix(in oklch, ${r.accent} 55%, transparent)` : "none",
              }}
            >
              {/* Active glow blob */}
              {active && (
                <div aria-hidden style={{ position:"absolute", inset:"auto -50% -50% auto", width:"280px", height:"280px", background:`radial-gradient(circle, ${r.accent}, transparent 70%)`, opacity:0.6, filter:"blur(20px)", pointerEvents:"none" }}/>
              )}
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", position:"relative" }}>
                <span style={{ fontSize:"10.5px", letterSpacing:"0.08em", color:"oklch(0.58 0.018 80)", textTransform:"uppercase", fontFamily:"var(--font-jetbrains-mono)" }}>{r.badge}</span>
                <ArrowRight size={16} style={{ color:"oklch(0.60 0.018 80)" }}/>
              </div>
              <div style={{ position:"relative", width:"44px", height:"44px", margin:"28px 0 16px", borderRadius:"12px", background:`color-mix(in oklch, ${r.accent} 30%, oklch(0.97 0.012 90))`, display:"grid", placeItems:"center", color:"oklch(0.18 0.018 75)", border:`1px solid color-mix(in oklch, ${r.accent} 55%, oklch(0.90 0.015 88))` }}>
                {r.icon}
              </div>
              <h3 style={{ fontFamily:"var(--font-instrument-serif)", fontSize:"clamp(26px,3vw,34px)", lineHeight:"1.05", letterSpacing:"-0.015em", margin:0, fontWeight:400, position:"relative" }}>{r.title}</h3>
              <p style={{ color:"oklch(0.40 0.020 75)", fontSize:"14px", lineHeight:"1.55", margin:"10px 0 24px", position:"relative" }}>{r.sub}</p>
              <div style={{ position:"relative", display:"flex", justifyContent:"space-between", alignItems:"center", paddingTop:"16px", borderTop:"1px dashed oklch(0.88 0.015 85)", color:"oklch(0.60 0.018 80)", fontSize:"12.5px" }}>
                <span style={{ fontFamily:"var(--font-jetbrains-mono)" }}>{r.steps.length} steps · ≈ 3 min</span>
                <span style={{ color:"oklch(0.18 0.018 75)", fontWeight:500, display:"inline-flex", alignItems:"center", gap:"4px" }}>Start <ArrowRight size={13}/></span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Step shell */}
      <div style={{ marginTop:"28px", border:"1px solid var(--line)", borderRadius:"clamp(16px,2.5vw,28px)", background:"var(--surface-card)", overflow:"hidden", boxShadow:"0 30px 60px -30px oklch(0.4 0.04 80 / 0.18)" }}>

        {/* Shell bar */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"clamp(12px,2vw,16px) clamp(16px,2.5vw,22px)", borderBottom:"1px solid oklch(0.90 0.015 88)", background:`color-mix(in oklch, ${role.accent} 12%, oklch(0.98 0.006 90))`, gap:"12px", flexWrap:"wrap", transition:"background 0.4s" }}>
          <div style={{ fontFamily:"var(--font-jetbrains-mono)", fontSize:"11.5px", letterSpacing:"0.08em", color:"oklch(0.50 0.02 80)", display:"inline-flex", alignItems:"center", gap:"8px" }}>
            <span style={{ width:"8px", height:"8px", borderRadius:"50%", background:role.accentDeep, boxShadow:`0 0 0 4px color-mix(in oklch, ${role.accent} 30%, transparent)`, display:"inline-block", flexShrink:0, transition:"all 0.4s" }}/>
            <span>{role.title.toUpperCase()} · {role.badge.toLowerCase()}</span>
          </div>
          {/* Line-type step bars */}
          <div style={{ display:"flex", alignItems:"center", gap:"6px" }}>
            {role.steps.map((_, si) => {
              const isActive = si === stepIdx;
              const isDone = si < stepIdx;
              return (
                <button key={si} onClick={() => goTo(roleIdx, si, si > stepIdx ? 1 : -1)}
                  style={{ position:"relative", width: isActive ? "52px" : "30px", height:"4px", borderRadius:"999px", border:0, cursor:"pointer", background: isDone ? role.accent : `color-mix(in oklch, ${role.accent} 22%, oklch(0.88 0.015 85))`, overflow:"hidden", padding:0, transition:"width 0.35s cubic-bezier(0.16,1,0.3,1), background 0.3s" }}
                >
                  {isActive && !paused && (
                    <span key={`${roleIdx}-${si}-${tick}`} style={{ position:"absolute", inset:0, background:role.accent, transformOrigin:"left", animation:`ob-barFill ${INTERVAL}ms linear forwards` }}/>
                  )}
                </button>
              );
            })}
            <span style={{ marginLeft:"10px", fontFamily:"var(--font-jetbrains-mono)", fontSize:"11.5px", color:"oklch(0.60 0.018 80)" }}>{stepIdx+1} / {role.steps.length}</span>
          </div>
        </div>

        {/* Grid: copy + mock */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(min(100%, 320px), 1fr))", minHeight:"460px" }}>

          {/* Copy — slides in */}
          <div
            key={`copy-${roleIdx}-${stepIdx}`}
            style={{ padding:"clamp(28px,4vw,44px) clamp(22px,3.5vw,36px)", borderRight:"1px solid oklch(0.90 0.015 88)", borderBottom:"1px solid oklch(0.90 0.015 88)", display:"flex", flexDirection:"column", animation:`${slideDir > 0 ? "ob-slideInR" : "ob-slideInL"} 0.5s cubic-bezier(0.16,1,0.3,1) both` }}
          >
            <span style={{ fontSize:"11.5px", fontFamily:"var(--font-jetbrains-mono)", letterSpacing:"0.1em", color:"oklch(0.60 0.018 80)" }}>{step.eyebrow}</span>
            <h4 style={{ fontFamily:"var(--font-instrument-serif)", fontSize:"clamp(28px,4vw,42px)", lineHeight:"1.05", letterSpacing:"-0.018em", margin:"14px 0 18px", fontWeight:400 }}>{step.title}</h4>
            <p style={{ fontSize:"clamp(14px,1.8vw,15.5px)", lineHeight:"1.6", color:"oklch(0.40 0.020 75)", margin:0, maxWidth:"38ch" }}>{step.body}</p>
            <div style={{ marginTop:"24px", padding:"14px 16px", borderRadius:"12px", background:`color-mix(in oklch, ${role.accent} 16%, oklch(0.97 0.012 90))`, border:`1px solid color-mix(in oklch, ${role.accent} 45%, oklch(0.90 0.015 88))`, fontSize:"13.5px", lineHeight:"1.5", display:"flex", gap:"10px", alignItems:"flex-start" }}>
              <span style={{ color:role.accentDeep, fontSize:"16px", lineHeight:"1.2", marginTop:"1px", flexShrink:0 }}>✦</span>
              <span>{step.tip}</span>
            </div>
            <div style={{ marginTop:"auto", paddingTop:"32px", display:"flex", gap:"10px", flexWrap:"wrap" }}>
              <button disabled={stepIdx===0} onClick={() => goTo(roleIdx, stepIdx-1, -1)}
                style={{ padding:"11px 18px", borderRadius:"999px", border:"1px solid oklch(0.82 0.020 85)", background:"transparent", fontSize:"14px", color:"oklch(0.18 0.018 75)", cursor: stepIdx===0 ? "not-allowed" : "pointer", opacity: stepIdx===0 ? 0.4 : 1, transition:"all 0.2s", display:"inline-flex", alignItems:"center", gap:"6px" }}>
                <ArrowLeft size={15}/> Back
              </button>
              {stepIdx < role.steps.length - 1 ? (
                <button onClick={() => goTo(roleIdx, stepIdx+1, 1)}
                  style={{ padding:"11px 18px", borderRadius:"999px", border:0, background:"oklch(0.136 0.022 72)", color:"#fdfaf2", fontSize:"14px", cursor:"pointer", transition:"all 0.2s", display:"inline-flex", alignItems:"center", gap:"6px" }}>
                  Next step <ArrowRight size={15}/>
                </button>
              ) : (
                <button onClick={() => { if (roleIdx < ROLES.length-1) goTo(roleIdx+1, 0, 1); else goTo(0, 0, 1); }}
                  style={{ padding:"11px 18px", borderRadius:"999px", border:0, background:"oklch(0.136 0.022 72)", color:"#fdfaf2", fontSize:"14px", cursor:"pointer", display:"inline-flex", alignItems:"center", gap:"6px" }}>
                  {roleIdx < ROLES.length-1 ? <>Try the next role <ArrowRight size={15}/></> : <>Restart <ArrowRight size={15}/></>}
                </button>
              )}
            </div>
          </div>

          {/* Mock panel */}
          <div
            key={`mock-${roleIdx}-${stepIdx}`}
            style={{ padding:"clamp(20px,3.5vw,36px)", background:`color-mix(in oklch, ${role.accent} 8%, oklch(0.97 0.012 90))`, position:"relative", overflow:"hidden", animation:`${slideDir > 0 ? "ob-slideInR" : "ob-slideInL"} 0.5s cubic-bezier(0.16,1,0.3,1) both 0.06s`, transition:"background 0.4s", display:"flex", alignItems:"center" }}
          >
            <div style={{ position:"absolute", inset:0, backgroundImage:"radial-gradient(oklch(0.7 0.02 80 / 0.06) 1px, transparent 1px)", backgroundSize:"14px 14px", pointerEvents:"none" }}/>
            <div style={{ position:"relative", width:"100%" }}>
              <UiMock accent={role.accent}/>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
