"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { Avatar, Icon, Panel } from "@/components/app/ui";
import { useTheme } from "@/components/theme-provider";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import type { Role } from "@prisma/client";

const ROLE_LABEL: Record<string, string> = { ADMIN: "Administrator", MANAGER: "Manager L1", EMPLOYEE: "Employee" };

const ACTIVITY = [
  { action: "Goal sheet submitted",   target: "FY26 Q2 · 5 goals",            when: "2h ago" },
  { action: "Achievement updated",    target: "MCU boot time — 390 ms actual", when: "1d ago" },
  { action: "Goal sheet approved",    target: "FY26 GS · Riya Menon",          when: "3d ago" },
  { action: "Shared goal accepted",   target: "Cost-down target ₹12 L",         when: "1w ago" },
  { action: "New goal sheet created", target: "FY26 Q2 · draft",                when: "2w ago" },
];

const STATS = [
  { label: "Goals this cycle", value: "5",     hint: "FY26 GS" },
  { label: "Avg score (Q1)",   value: "1.04×", hint: "above target" },
  { label: "Sheets approved",  value: "4",     hint: "of 4 submitted" },
  { label: "Check-ins done",   value: "3 / 4", hint: "Q1–Q3" },
];

function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (next !== confirm) { toast.error("Passwords don't match"); return; }
    if (next.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current, next }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed to change password"); return; }
      toast.success("Password changed — confirmation email sent");
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: "var(--surface-card)", border: "1px solid var(--line)", borderRadius: 12, padding: "28px 32px", width: 400, maxWidth: "90vw" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "var(--ink)" }}>Change password</h2>
          <button onClick={onClose} className="btn-ghost" style={{ padding: "4px 8px", fontSize: 18, lineHeight: 1 }}>×</button>
        </div>
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {([
            { label: "CURRENT PASSWORD", val: current, set: setCurrent, ph: "", af: true },
            { label: "NEW PASSWORD",     val: next,    set: setNext,    ph: "Min 8 characters", af: false },
            { label: "CONFIRM NEW PASSWORD", val: confirm, set: setConfirm, ph: "", af: false },
          ] as const).map((f) => (
            <label key={f.label} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <span className="setting-field-label">{f.label}</span>
              <input
                type="password"
                value={f.val}
                onChange={(e) => (f.set as (v: string) => void)(e.target.value)}
                required minLength={8}
                placeholder={f.ph}
                autoFocus={f.af}
                style={{ padding: "10px 12px", border: "1px solid var(--line)", borderRadius: "var(--r-sm)", background: "var(--bg-elev)", fontSize: 14, color: "var(--ink)", outline: "none" }}
              />
            </label>
          ))}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 6 }}>
            <button type="button" className="btn-ghost" onClick={onClose} style={{ fontSize: 12, padding: "8px 14px" }}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading} style={{ fontSize: 12, padding: "8px 14px" }}>
              {loading ? "Saving…" : "Change password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface Props {
  user: {
    name: string;
    email: string;
    role: Role;
    department?: string | null;
    manager?: string | null;
  };
}

const TABS = [
  { k: "profile", n: "Profile",       ic: "user" },
  { k: "notif",   n: "Notifications", ic: "bell" },
  { k: "sso",     n: "Sign-in & SSO", ic: "check" },
  { k: "theme",   n: "Appearance",    ic: "moon" },
  { k: "about",   n: "About",         ic: "help" },
] as const;
type Tab = (typeof TABS)[number]["k"];

export function SettingsClient({ user }: Props) {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>(() => {
    const t = searchParams.get("tab");
    return (TABS.some((x) => x.k === t) ? t : "profile") as Tab;
  });

  useEffect(() => {
    const t = searchParams.get("tab");
    if (t && TABS.some((x) => x.k === t)) setTab(t as Tab);
  }, [searchParams]);

  const [showChangePw, setShowChangePw] = useState(false);

  const NOTIF_KEY = "atomquest:notifPrefs";
  const NOTIF_DEFAULTS = { email: true, teams: true, weekly: false, mentions: true };
  const [notif, setNotif] = useState<typeof NOTIF_DEFAULTS>(() => {
    if (typeof window === "undefined") return NOTIF_DEFAULTS;
    try { return { ...NOTIF_DEFAULTS, ...JSON.parse(localStorage.getItem(NOTIF_KEY) ?? "{}") }; } catch { return NOTIF_DEFAULTS; }
  });

  function toggleNotif(k: keyof typeof NOTIF_DEFAULTS) {
    const next = { ...notif, [k]: !notif[k] };
    setNotif(next);
    try { localStorage.setItem(NOTIF_KEY, JSON.stringify(next)); } catch {}
  }

  const { theme, setTheme } = useTheme();

  // Profile editing state
  const { data: session, update: updateSession } = useSession();
  const sUser = session?.user;
  const [profileEditing, setProfileEditing] = useState(false);
  const [profileName, setProfileName] = useState(sUser?.name ?? user.name);
  const [profileAvatar, setProfileAvatar] = useState((sUser as { avatarUrl?: string })?.avatarUrl ?? "");

  useEffect(() => {
    if (!profileEditing && sUser?.name) setProfileName(sUser.name);
  }, [sUser?.name, profileEditing]);
  const [profileSaving, setProfileSaving] = useState(false);
  const initials = (sUser?.name ?? user.name).split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  async function saveProfile() {
    setProfileSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: profileName || undefined, avatarUrl: profileAvatar || null }),
      });
      if (res.ok) {
        toast.success("Profile updated");
        await updateSession();
        setProfileEditing(false);
      } else {
        const e = await res.json();
        toast.error(e.error ?? "Failed to save");
      }
    } finally { setProfileSaving(false); }
  }

  return (
    <>
    {showChangePw && <ChangePasswordModal onClose={() => setShowChangePw(false)} />}
    <div className="fade-up">
      <div className="page-head">
        <div>
          <span className="page-eyebrow">Account &amp; preferences</span>
          <h1 className="page-title">Settings</h1>
          <p className="page-lede">Manage your profile, notifications, sign-in method, and theme.</p>
        </div>
      </div>

      <div className="settings-grid">
        <aside className="settings-nav">
          {TABS.map((t) => (
            <button
              key={t.k}
              className={"settings-tab" + (tab === t.k ? " on" : "")}
              onClick={() => setTab(t.k)}
            >
              <Icon name={t.ic} size={16} /> {t.n}
            </button>
          ))}
        </aside>

        <div className="settings-pane">
          {tab === "profile" && (
            <div className="space-y-5">
              {/* Identity */}
              <Panel title="Identity" sub="Your name, avatar, and role">
                <div style={{ display: "flex", alignItems: "flex-start", gap: "20px", flexWrap: "wrap" }}>
                  <div style={{ flexShrink: 0 }}>
                    {profileAvatar ? (
                      <Image src={profileAvatar} alt={initials} width={72} height={72} style={{ borderRadius: "50%", objectFit: "cover", boxShadow: "0 0 0 4px var(--brand-soft)" }} onError={() => setProfileAvatar("")} />
                    ) : (
                      <div style={{ width: 72, height: 72, borderRadius: "50%", background: "var(--brand)", color: "var(--brand-fg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 700, boxShadow: "0 0 0 4px var(--brand-soft)" }}>
                        {initials}
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {profileEditing ? (
                      <div className="space-y-3">
                        <div>
                          <span style={{ fontSize: "11px", fontFamily: "var(--font-jetbrains-mono)", color: "var(--ink-mute)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Display name</span>
                          <input value={profileName} onChange={(e) => setProfileName(e.target.value)}
                            style={{ marginTop: "4px", width: "100%", padding: "8px 12px", borderRadius: "10px", border: "1px solid var(--line-strong)", background: "var(--bg)", fontSize: "14px", color: "var(--ink)", outline: "none", display: "block" }} />
                        </div>
                        <div>
                          <span style={{ fontSize: "11px", fontFamily: "var(--font-jetbrains-mono)", color: "var(--ink-mute)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Avatar image URL</span>
                          <input value={profileAvatar} onChange={(e) => setProfileAvatar(e.target.value)} placeholder="https://…"
                            style={{ marginTop: "4px", width: "100%", padding: "8px 12px", borderRadius: "10px", border: "1px solid var(--line-strong)", background: "var(--bg)", fontSize: "13px", color: "var(--ink)", outline: "none", display: "block", fontFamily: "var(--font-jetbrains-mono)" }} />
                          <span style={{ fontSize: "11px", color: "var(--ink-mute)" }}>Paste any public image URL — JPG, PNG, WebP</span>
                        </div>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button className="btn-primary" style={{ fontSize: 13, padding: "7px 14px" }} onClick={saveProfile} disabled={profileSaving}>{profileSaving ? "Saving…" : "Save"}</button>
                          <button className="btn-ghost" style={{ fontSize: 13, padding: "7px 14px" }} onClick={() => setProfileEditing(false)}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p style={{ fontSize: "22px", fontWeight: 600, color: "var(--ink)", marginBottom: "4px" }}>{sUser?.name ?? user.name}</p>
                        <p style={{ fontSize: "13.5px", color: "var(--ink-mute)", fontFamily: "var(--font-jetbrains-mono)", marginBottom: "8px" }}>{sUser?.email ?? user.email}</p>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span className="pill" style={{ background: "oklch(0.94 0.06 290)", color: "oklch(0.40 0.12 290)", fontSize: "11.5px" }}>
                            {ROLE_LABEL[sUser?.role ?? user.role] ?? user.role}
                          </span>
                          <button className="btn-secondary" style={{ fontSize: 13, padding: "5px 12px", display: "inline-flex", alignItems: "center", gap: "5px" }} onClick={() => setProfileEditing(true)}>
                            <Icon name="pencil" size={12} /> Edit profile
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </Panel>

              {/* Stats */}
              <div className="stats-row">
                {STATS.map((s) => (
                  <div key={s.label} className="stat-card">
                    <div className="stat-lbl">{s.label}</div>
                    <div className="stat-val">{s.value}</div>
                    <div className="text-xs mt-2" style={{ color: "var(--ink-mute)" }}>{s.hint}</div>
                  </div>
                ))}
              </div>

              {/* Account details */}
              <Panel title="Account details" sub="Read-only — managed by your administrator">
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px" }}>
                  {[
                    { label: "Full name",   value: sUser?.name ?? user.name },
                    { label: "Email",       value: sUser?.email ?? user.email },
                    { label: "Role",        value: ROLE_LABEL[sUser?.role ?? user.role] ?? user.role },
                    { label: "Department",  value: user.department ?? "—" },
                    { label: "Manager",     value: user.manager ?? "—" },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ink-mute)", fontFamily: "var(--font-jetbrains-mono)", marginBottom: "4px" }}>{label}</p>
                      <p style={{ fontSize: "14px", color: "var(--ink)", fontWeight: 500 }}>{value}</p>
                    </div>
                  ))}
                </div>
              </Panel>

              {/* Recent activity */}
              <Panel title="Recent activity" sub="Your last 5 actions in AtomQuest">
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {ACTIVITY.map((a, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: i < ACTIVITY.length - 1 ? "1px solid var(--line)" : "none" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--brand)", display: "inline-block", flexShrink: 0 }} />
                        <div>
                          <p style={{ fontSize: "13.5px", fontWeight: 500, color: "var(--ink)", margin: 0 }}>{a.action}</p>
                          <p style={{ fontSize: "11.5px", color: "var(--ink-mute)", margin: "2px 0 0", fontFamily: "var(--font-jetbrains-mono)" }}>{a.target}</p>
                        </div>
                      </div>
                      <span style={{ fontSize: "11px", color: "var(--ink-mute)", fontFamily: "var(--font-jetbrains-mono)", flexShrink: 0 }}>{a.when}</span>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>
          )}

          {tab === "notif" && (
            <Panel title="Notifications" sub="When AtomQuest pings you, and where.">
              <div className="auto-list">
                {([
                  { k: "email",    n: "Email",           d: "Approvals, mentions, deadline reminders." },
                  { k: "teams",    n: "Microsoft Teams",  d: "Adaptive cards in your personal scope." },
                  { k: "weekly",   n: "Weekly digest",    d: "Friday 16:00 IST summary." },
                  { k: "mentions", n: "@mentions only",   d: "Quiet by default; ping me only when tagged." },
                ] as const).map((a) => (
                  <label key={a.k} className="auto-row">
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--ink)" }}>{a.n}</div>
                      <div style={{ fontSize: 12, color: "var(--ink-mute)", marginTop: 2 }}>{a.d}</div>
                    </div>
                    <button
                      className={"toggle" + (notif[a.k] ? " on" : "")}
                      onClick={() => toggleNotif(a.k)}
                    >
                      <span className="toggle-knob" />
                    </button>
                  </label>
                ))}
              </div>
            </Panel>
          )}

          {tab === "sso" && (
            <Panel title="Sign-in &amp; SSO" sub="How you authenticate to AtomQuest.">
              <div className="sso-card">
                <div className="ms-tile" aria-hidden="true">
                  <span /><span /><span /><span />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--ink)" }}>Microsoft Entra ID</div>
                  <div style={{ fontSize: 12, color: "var(--ink-mute)", marginTop: 2 }}>
                    Tenant: atomberg.onmicrosoft.com · last sign-in 2h ago
                  </div>
                </div>
                <span className="pill st-approved">connected</span>
              </div>
              <div className="auto-list" style={{ marginTop: 12 }}>
                <label className="auto-row">
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--ink)" }}>Password</div>
                    <div style={{ fontSize: 12, color: "var(--ink-mute)", marginTop: 2 }}>
                      Local password sign-in · last changed 64 days ago.
                    </div>
                  </div>
                  <button className="btn-ghost" style={{ fontSize: 12, padding: "6px 12px", flexShrink: 0 }} onClick={() => setShowChangePw(true)}>
                    Change password
                  </button>
                </label>
                <label className="auto-row">
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--ink)" }}>Active sessions</div>
                    <div style={{ fontSize: 12, color: "var(--ink-mute)", marginTop: 2 }}>
                      2 sessions across 2 devices.
                    </div>
                  </div>
                  <button className="btn-ghost" style={{ fontSize: 12, padding: "6px 12px", flexShrink: 0 }} onClick={() => toast.info("Sign out of other sessions via your Microsoft Entra ID portal, or sign out here and sign back in.")}>
                    Manage
                  </button>
                </label>
              </div>
            </Panel>
          )}

          {tab === "theme" && (
            <Panel title="Appearance" sub="Light by default. Dark mode lands in v2.">
              <div className="theme-grid">
                {([
                  { id: "light", n: "Light",  c1: "#fdfaf2", c2: "oklch(0.86 0.175 88)", soon: false },
                  { id: "dim",   n: "Cream",  c1: "#f4ead2", c2: "oklch(0.86 0.175 88)", soon: false },
                  { id: "dark",  n: "Dark",   c1: "#1a1814", c2: "oklch(0.86 0.175 88)", soon: false },
                ] as const).map((t) => (
                  <button
                    key={t.id}
                    className={"theme-card" + (theme === t.id ? " on" : "")}
                    onClick={() => !t.soon && setTheme(t.id)}
                    disabled={t.soon}
                  >
                    <div className="theme-swatch" style={{ background: t.c1 }}>
                      <span style={{ background: t.c2 }} />
                    </div>
                    <div className="theme-n">
                      {t.n}
                      {t.soon && (
                        <span className="pill" style={{ marginLeft: 6, fontSize: 10 }}>soon</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </Panel>
          )}

          {tab === "about" && (
            <div className="space-y-5">
              {/* Builder card */}
              <Panel title="Built by" sub="The human behind the hackathon build.">
                <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
                  <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--brand)", color: "var(--brand-fg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 700, flexShrink: 0, boxShadow: "0 0 0 4px var(--brand-soft)" }}>
                    OS
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 20, fontWeight: 700, color: "var(--ink)", margin: 0, letterSpacing: "-0.02em" }}>Om Sharma</p>
                    <p style={{ fontSize: 12.5, color: "var(--ink-mute)", margin: "4px 0 12px", fontFamily: "var(--font-jetbrains-mono)" }}>Full-stack · Hackathon engineer</p>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <a href="mailto:omsharma050322@gmail.com"
                        style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, padding: "5px 11px", borderRadius: 20, border: "1px solid var(--line-strong)", color: "var(--ink)", textDecoration: "none", background: "var(--bg-elev)" }}>
                        <Icon name="mail" size={12} /> omsharma050322@gmail.com
                      </a>
                      <a href="https://om.garcade.in" target="_blank" rel="noopener noreferrer"
                        style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, padding: "5px 11px", borderRadius: 20, border: "1px solid var(--line-strong)", color: "var(--ink)", textDecoration: "none", background: "var(--bg-elev)" }}>
                        <Icon name="globe" size={12} /> om.garcade.in
                      </a>
                      <a href="https://www.linkedin.com/in/omsharma050322" target="_blank" rel="noopener noreferrer"
                        style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, padding: "5px 11px", borderRadius: 20, border: "1px solid var(--line-strong)", color: "var(--ink)", textDecoration: "none", background: "var(--bg-elev)" }}>
                        <Icon name="link" size={12} /> LinkedIn
                      </a>
                    </div>
                  </div>
                </div>
              </Panel>

              {/* Project overview */}
              <Panel title="AtomQuest" sub="Goal Setting & Tracking Portal · Atomberg Technologies">
                <p style={{ fontSize: 14, color: "var(--ink-mute)", lineHeight: 1.7, margin: "0 0 16px" }}>
                  AtomQuest is an internal performance management platform built to replace disconnected spreadsheets
                  and email chains. It gives every employee a structured space to set measurable goals, track
                  achievements, run quarterly check-ins, and get manager approvals — all in one place.
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                  {[
                    { label: "Roles",   value: "3",         hint: "Admin · Manager · Employee" },
                    { label: "Built in", value: "48h",       hint: "May 2026 hackathon" },
                    { label: "Stack",   value: "Next 16",    hint: "Prisma 7 · Supabase" },
                  ].map((s) => (
                    <div key={s.label} style={{ padding: "14px 16px", borderRadius: 10, border: "1px solid var(--line)", background: "var(--bg-elev)" }}>
                      <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ink-mute)", fontFamily: "var(--font-jetbrains-mono)", margin: "0 0 6px" }}>{s.label}</p>
                      <p style={{ fontSize: 20, fontWeight: 700, color: "var(--ink)", margin: "0 0 4px", letterSpacing: "-0.02em" }}>{s.value}</p>
                      <p style={{ fontSize: 11.5, color: "var(--ink-mute)", margin: 0 }}>{s.hint}</p>
                    </div>
                  ))}
                </div>
              </Panel>

              {/* Why it exists */}
              <Panel title="Why it exists" sub="The problem this solves.">
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {[
                    { t: "No more spreadsheet chaos",        d: "Goal sheets lived in Google Sheets with no access control, no audit trail, and no single source of truth." },
                    { t: "Structured accountability",         d: "Weightage-based scoring (with min 10% / max 100% guard-rails) makes performance transparent and objective." },
                    { t: "Manager bottleneck visibility",     d: "Escalation engine surfaces overdue approvals automatically so nothing slips through the cracks." },
                    { t: "Cross-team alignment",              d: "Shared goals let managers distribute targets to their team with achievements synced from the owner — no duplicate entry." },
                  ].map((item, i) => (
                    <div key={i} style={{ display: "flex", gap: 14, paddingBottom: 12, borderBottom: i < 3 ? "1px solid var(--line)" : "none" }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--brand)", flexShrink: 0, marginTop: 6 }} />
                      <div>
                        <p style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)", margin: "0 0 3px" }}>{item.t}</p>
                        <p style={{ fontSize: 12.5, color: "var(--ink-mute)", margin: 0, lineHeight: 1.6 }}>{item.d}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>

              {/* Meta */}
              <Panel title="Build info" sub="Version and support.">
                <div className="about-list">
                  <div className="about-row">
                    <span className="about-label">VERSION</span>
                    <span style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: 13 }}>2026.Q2 · build a774</span>
                  </div>
                  <div className="about-row">
                    <span className="about-label">BUILT</span>
                    <span style={{ fontSize: 13.5 }}>48-hour hackathon · May 2026</span>
                  </div>
                  <div className="about-row">
                    <span className="about-label">STACK</span>
                    <span style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: 13 }}>
                      Next 16 · Prisma 7 · shadcn v4 · Supabase
                    </span>
                  </div>
                  <div className="about-row">
                    <span className="about-label">CONTACT</span>
                    <a href="mailto:omsharma050322@gmail.com"
                      style={{ fontSize: 13.5, color: "var(--ink)", textDecoration: "underline", textDecorationColor: "var(--line-strong)", fontFamily: "var(--font-jetbrains-mono)" }}>
                      omsharma050322@gmail.com
                    </a>
                  </div>
                </div>
              </Panel>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
export default SettingsClient;
