"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, AlertCircle, Users, Frown, X } from "lucide-react";

const DEMO = [
  { role: "Employee", email: "emp@demo.com",     pw: "Emp@123" },
  { role: "Manager",  email: "manager@demo.com",  pw: "Manager@123" },
  { role: "Admin",    email: "admin@demo.com",    pw: "Admin@123" },
];

const ROLES = [
  { id: "EMPLOYEE", label: "Employee",  sub: "Draft & track" },
  { id: "MANAGER",  label: "Manager",   sub: "Review & align" },
  { id: "ADMIN",    label: "Admin",     sub: "Run the cycle" },
];

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite") ?? "";
  const prefilledEmail = searchParams.get("email") ?? "";
  const [inviteManagerName, setInviteManagerName] = useState<string | null>(null);
  const [tab, setTab] = useState<"signin" | "signup">(inviteToken ? "signup" : "signin");

  // Sign in state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showEntraDialog, setShowEntraDialog] = useState(false);

  useEffect(() => {
    if (!inviteToken) return;
    fetch(`/api/invites/validate?token=${inviteToken}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d?.managerName) setInviteManagerName(d.managerName); })
      .catch(() => {});
  }, [inviteToken]);

  // Sign up state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [suEmail, setSuEmail] = useState(prefilledEmail);
  const [suPassword, setSuPassword] = useState("");
  const [suRole, setSuRole] = useState("EMPLOYEE");
  const [suError, setSuError] = useState("");
  const [suLoading, setSuLoading] = useState(false);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await signIn("credentials", { email, password, redirect: false });
    if (result?.error) {
      setError("Invalid email or password");
      setLoading(false);
      return;
    }
    router.push("/");
    router.refresh();
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setSuError("");
    if (suPassword.length < 6) {
      setSuError("Password must be at least 6 characters");
      return;
    }
    if (!firstName.trim() || !lastName.trim()) {
      setSuError("Please enter your full name");
      return;
    }
    setSuLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: `${firstName} ${lastName}`, email: suEmail, password: suPassword, role: inviteToken ? "EMPLOYEE" : suRole, ...(inviteToken ? { inviteToken } : {}) }),
      });
      if (!res.ok) {
        const data = await res.json();
        setSuError(data.error || "Signup failed");
        setSuLoading(false);
        return;
      }
      const result = await signIn("credentials", { email: suEmail, password: suPassword, redirect: false });
      if (result?.error) { setSuError("Account created — sign in below"); setSuLoading(false); setTab("signin"); return; }
      router.push("/");
      router.refresh();
    } catch {
      setSuError("Something went wrong. Try again.");
      setSuLoading(false);
    }
  }

  function fillDemo(d: (typeof DEMO)[0]) {
    setEmail(d.email);
    setPassword(d.pw);
    if (tab !== "signin") setTab("signin");
  }

  const inputStyle = {
    width: "100%", padding: "11px 14px", background: "#fff",
    border: "1px solid oklch(0.90 0.015 88)", borderRadius: "12px",
    fontSize: "14px", color: "oklch(0.18 0.018 75)", outline: "none",
    transition: "border-color .2s, box-shadow .25s",
  };

  return (
    <div className="min-h-screen flex relative" style={{ background: "#fdfaf2", color: "oklch(0.18 0.018 75)" }}>
      {/* Grain */}
      <div className="fixed inset-0 pointer-events-none z-[1] opacity-30" style={{ mixBlendMode: "multiply", backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.10  0 0 0 0 0.09  0 0 0 0 0.07  0 0 0 0.06 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")" }} />

      {/* Back link */}
      <Link href="/" className="fixed top-5 left-7 z-30 inline-flex items-center gap-1.5 text-[13px] font-medium transition-all hover:-translate-x-0.5" style={{ color: "oklch(0.55 0.018 80)" }}>
        <ArrowLeft size={14} strokeWidth={2} />
        Back
      </Link>

      {/* Brand pane */}
      <aside className="hidden lg:flex flex-col relative overflow-hidden" style={{ width: "45%", minWidth: "45%", background: "oklch(0.136 0.022 72)", color: "#fdfaf2", padding: "56px 56px 40px" }}>
        {/* Glows */}
        <div className="absolute pointer-events-none" style={{ inset: "-20% -30% auto auto", width: "80%", aspectRatio: "1", background: "radial-gradient(circle, oklch(0.86 0.175 88 / 0.35), oklch(0.74 0.180 75 / 0) 65%)", filter: "blur(20px)" }} />
        <div className="absolute pointer-events-none" style={{ left: "-10%", bottom: "-25%", width: "60%", aspectRatio: "1", background: "radial-gradient(circle, oklch(0.86 0.175 88 / 0.15), transparent 70%)", filter: "blur(30px)" }} />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <Image src="/atomberg-logo.png" alt="Atomberg" width={38} height={38} className="rounded-[10px]" style={{ boxShadow: "0 2px 0 oklch(0.7 0.16 75 / 0.4), 0 8px 24px -8px oklch(0.6 0.16 60 / 0.4)" }} />
          <div>
            <p className="font-semibold text-base tracking-tight" style={{ color: "#fdfaf2" }}>AtomQuest</p>
            <p className="text-[11.5px] uppercase tracking-[0.08em] mt-0.5" style={{ color: "oklch(0.70 0.04 80)", fontFamily: "var(--font-jetbrains-mono)" }}>Atomberg · OKR portal</p>
          </div>
        </div>

        {/* Floating atom */}
        <div className="absolute pointer-events-none" style={{ right: "8%", top: "50%", transform: "translateY(-50%)", width: "220px", height: "220px", opacity: 0.55 }}>
          <svg viewBox="-60 -60 120 120" className="w-full h-full animate-orbit-spin">
            <ellipse fill="none" stroke="oklch(0.86 0.175 88)" strokeWidth="1" cx="0" cy="0" rx="54" ry="20" />
            <ellipse fill="none" stroke="oklch(0.86 0.175 88)" strokeWidth="1" cx="0" cy="0" rx="54" ry="20" transform="rotate(60)" />
            <ellipse fill="none" stroke="oklch(0.86 0.175 88)" strokeWidth="1" cx="0" cy="0" rx="54" ry="20" transform="rotate(-60)" />
            <circle fill="oklch(0.86 0.175 88)" cx="0" cy="0" r="10" />
          </svg>
        </div>

        {/* Hero copy */}
        <div className="relative z-10 flex-1 flex flex-col justify-center">
          <h1 className="font-serif" style={{ fontSize: "clamp(40px, 4.5vw, 68px)", lineHeight: "1", letterSpacing: "-0.02em", maxWidth: "14ch" }}>
            Goals,<br /><em style={{ fontStyle: "italic", color: "oklch(0.86 0.175 88)" }}>in&nbsp;orbit.</em>
          </h1>
          <p className="mt-7 pb-6 text-sm leading-relaxed max-w-[32ch]" style={{ color: "oklch(0.78 0.02 80)", borderTop: "1px dashed oklch(0.5 0.02 80 / 0.4)", paddingTop: "24px", marginTop: "28px" }}>
            A quiet OKR workspace built for Atomberg's product, ops and engineering teams. <strong style={{ color: "#fdfaf2", fontWeight: 500 }}>Set the spin. Track the gain.</strong>
          </p>
        </div>

        {/* Stats */}
        <div className="relative z-10 grid grid-cols-3 gap-7">
          {[{ n: "482", l: "People" }, { n: "3,841", l: "Goals tracked" }, { n: "12", l: "Quarters in" }].map((s) => (
            <div key={s.l}>
              <div className="font-serif text-3xl leading-none" style={{ color: "oklch(0.86 0.175 88)" }}>{s.n}</div>
              <div className="text-[11px] uppercase tracking-[0.06em] mt-1" style={{ color: "oklch(0.68 0.02 80)", fontFamily: "var(--font-jetbrains-mono)" }}>{s.l}</div>
            </div>
          ))}
        </div>
      </aside>

      {/* Form pane */}
      <main className="flex-1 flex flex-col relative z-[2]" style={{ background: "#fdfaf2", padding: "32px 48px 24px" }}>
        <div className="flex-1 flex flex-col justify-center max-w-[440px] mx-auto w-full">
          {/* Tabs */}
          <div className="inline-flex p-1 rounded-full mb-5 self-start" style={{ background: "oklch(0.972 0.018 92)", border: "1px solid oklch(0.90 0.015 88)" }}>
            {(["signin", "signup"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)} className="px-[18px] py-2 rounded-full text-[13px] transition-all duration-300" style={{
                color: tab === t ? "oklch(0.18 0.018 75)" : "oklch(0.40 0.020 75)",
                background: tab === t ? "#fff" : "transparent",
                boxShadow: tab === t ? "0 1px 0 oklch(0.85 0.02 85 / 0.6), 0 4px 12px -4px oklch(0.4 0.04 80 / 0.18)" : "none",
                cursor: "pointer", border: "none", fontFamily: "inherit",
              }}>
                {t === "signin" ? "Sign in" : "Sign up"}
              </button>
            ))}
          </div>

          {/* ── Sign In ── */}
          {tab === "signin" && (
            <div className="fade-in">
              <h2 className="font-serif m-0" style={{ fontSize: "44px", lineHeight: "1.1", letterSpacing: "-0.022em" }}>
                Welcome <em style={{ fontStyle: "italic", color: "oklch(0.72 0.180 75)" }}>back.</em>
              </h2>
              <p className="mt-2 mb-4 text-[14px] leading-relaxed" style={{ color: "oklch(0.40 0.020 75)" }}>
                Pick up where you left off. Drafts are autosaved.
              </p>
              <form onSubmit={handleSignIn} className="space-y-3">
                <div>
                  <label className="block text-[11px] uppercase tracking-[0.06em] mb-1.5" style={{ color: "oklch(0.58 0.018 80)", fontFamily: "var(--font-jetbrains-mono)" }}>Work email</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@atomberg.com" required style={inputStyle}
                    onFocus={(e) => { e.target.style.borderColor = "oklch(0.72 0.180 75)"; e.target.style.boxShadow = "0 0 0 4px oklch(0.96 0.10 90)"; }}
                    onBlur={(e) => { e.target.style.borderColor = "oklch(0.90 0.015 88)"; e.target.style.boxShadow = "none"; }} />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-[0.06em] mb-1.5" style={{ color: "oklch(0.58 0.018 80)", fontFamily: "var(--font-jetbrains-mono)" }}>Password</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••••" required style={inputStyle}
                    onFocus={(e) => { e.target.style.borderColor = "oklch(0.72 0.180 75)"; e.target.style.boxShadow = "0 0 0 4px oklch(0.96 0.10 90)"; }}
                    onBlur={(e) => { e.target.style.borderColor = "oklch(0.90 0.015 88)"; e.target.style.boxShadow = "none"; }} />
                </div>
                {error && (
                  <div className="flex items-center gap-2 text-sm px-3 py-2.5 rounded-xl" style={{ background: "oklch(0.97 0.065 28)", color: "oklch(0.62 0.200 28)", border: "1px solid oklch(0.88 0.08 28)" }}>
                    <AlertCircle className="w-4 h-4 shrink-0" />{error}
                  </div>
                )}
                <div style={{ textAlign: "right", marginTop: "-4px" }}>
                  <a href="/forgot-password" style={{ fontSize: "12px", color: "oklch(0.55 0.018 80)", textDecoration: "none" }}
                    onMouseOver={(e) => (e.currentTarget.style.color = "oklch(0.72 0.180 75)")}
                    onMouseOut={(e) => (e.currentTarget.style.color = "oklch(0.55 0.018 80)")}>
                    Forgot password?
                  </a>
                </div>
                <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2.5 font-medium transition-all duration-200 hover:-translate-y-px disabled:opacity-60 disabled:cursor-not-allowed" style={{ padding: "12px", background: "oklch(0.136 0.022 72)", color: "#fdfaf2", borderRadius: "12px", fontSize: "14px", border: "none", boxShadow: "0 14px 30px -12px oklch(0.2 0.02 80 / 0.4)" }}>
                  {loading ? <span className="w-4 h-4 border-2 rounded-full border-white/30 border-t-white" style={{ animation: "spin 0.7s linear infinite" }} /> : <><span>Sign in</span><ArrowRight className="w-4 h-4" /></>}
                </button>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-3.5 my-3 text-[11px] uppercase tracking-[0.1em]" style={{ color: "oklch(0.58 0.018 80)", fontFamily: "var(--font-jetbrains-mono)" }}>
                <div className="flex-1 h-px" style={{ background: "oklch(0.90 0.015 88)" }} />
                or continue with
                <div className="flex-1 h-px" style={{ background: "oklch(0.90 0.015 88)" }} />
              </div>

              {/* SSO */}
              <button type="button" onClick={() => setShowEntraDialog(true)} className="w-full flex items-center justify-center gap-2.5 transition-all hover:-translate-y-px text-sm font-medium" style={{ padding: "10px", border: "1px solid oklch(0.82 0.020 85)", borderRadius: "12px", background: "#fff", cursor: "pointer", fontFamily: "inherit" }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 21 21">
                  <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
                  <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
                  <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
                  <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
                </svg>
                Microsoft Entra ID
              </button>

              {/* Demo cards */}
              <div className="mt-3 rounded-xl p-3" style={{ background: "oklch(0.972 0.018 92)", border: "1px dashed oklch(0.82 0.020 85)" }}>
                <p className="text-[10.5px] uppercase tracking-[0.1em] mb-2" style={{ color: "oklch(0.58 0.018 80)", fontFamily: "var(--font-jetbrains-mono)" }}>Demo accounts · click to autofill</p>
                <div className="grid grid-cols-3 gap-2">
                  {DEMO.map((d) => (
                    <button key={d.role} type="button" onClick={() => fillDemo(d)} className="text-left rounded-xl p-2 transition-all duration-150 hover:-translate-y-px cursor-pointer" style={{ background: "#fff", border: "1px solid oklch(0.90 0.015 88)", fontFamily: "inherit" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "oklch(0.72 0.180 75)"; (e.currentTarget as HTMLElement).style.background = "oklch(0.96 0.080 90)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "oklch(0.90 0.015 88)"; (e.currentTarget as HTMLElement).style.background = "#fff"; }}>
                      <p className="text-[12px] font-medium m-0" style={{ color: "oklch(0.18 0.018 75)" }}>{d.role}</p>
                      <p className="text-[10.5px] mt-0.5 m-0" style={{ color: "oklch(0.58 0.018 80)", fontFamily: "var(--font-jetbrains-mono)" }}>{d.pw}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Sign Up ── */}
          {tab === "signup" && (
            <div className="fade-in">
              <h2 className="font-serif m-0" style={{ fontSize: "44px", lineHeight: "1.1", letterSpacing: "-0.022em" }}>
                Start the <em style={{ fontStyle: "italic", color: "oklch(0.72 0.180 75)" }}>cycle.</em>
              </h2>
              <p className="mt-2 mb-4 text-[14px] leading-relaxed" style={{ color: "oklch(0.40 0.020 75)" }}>
                Your manager gets pinged once you draft your first sheet.
              </p>
              {(inviteToken && (inviteManagerName || prefilledEmail)) && (
                <div className="flex items-center gap-3 mb-4 rounded-xl" style={{ background: "oklch(0.96 0.07 92)", border: "1px solid oklch(0.88 0.12 88)", padding: "10px 14px" }}>
                  <Users className="w-4 h-4 shrink-0" style={{ color: "oklch(0.55 0.14 80)" }} />
                  <div style={{ paddingLeft: "6px" }}>
                    <p className="m-0 text-[13px] font-medium" style={{ color: "oklch(0.28 0.10 75)" }}>
                      {prefilledEmail || "You've been invited"}
                    </p>
                    <p className="m-0 text-[11.5px] mt-0.5" style={{ color: "oklch(0.50 0.06 80)" }}>
                      You&apos;ll be automatically added to the team on signup.
                    </p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSignUp} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "First name", val: firstName, set: setFirstName, ph: "Anika" },
                    { label: "Last name",  val: lastName,  set: setLastName,  ph: "Sharma" },
                  ].map(({ label, val, set, ph }) => (
                    <div key={label}>
                      <label className="block text-[11px] uppercase tracking-[0.06em] mb-1.5" style={{ color: "oklch(0.58 0.018 80)", fontFamily: "var(--font-jetbrains-mono)" }}>{label}</label>
                      <input type="text" value={val} onChange={(e) => set(e.target.value)} placeholder={ph} required style={inputStyle}
                        onFocus={(e) => { e.target.style.borderColor = "oklch(0.72 0.180 75)"; e.target.style.boxShadow = "0 0 0 4px oklch(0.96 0.10 90)"; }}
                        onBlur={(e) => { e.target.style.borderColor = "oklch(0.90 0.015 88)"; e.target.style.boxShadow = "none"; }} />
                    </div>
                  ))}
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-[0.06em] mb-1.5" style={{ color: "oklch(0.58 0.018 80)", fontFamily: "var(--font-jetbrains-mono)" }}>Work email</label>
                  <input type="email" value={suEmail} onChange={(e) => setSuEmail(e.target.value)} placeholder="you@atomberg.com" required
                    readOnly={!!prefilledEmail}
                    style={{ ...inputStyle, ...(prefilledEmail ? { background: "oklch(0.97 0.008 88)", color: "oklch(0.45 0.018 80)", cursor: "default" } : {}) }}
                    onFocus={(e) => { if (!prefilledEmail) { e.target.style.borderColor = "oklch(0.72 0.180 75)"; e.target.style.boxShadow = "0 0 0 4px oklch(0.96 0.10 90)"; } }}
                    onBlur={(e) => { e.target.style.borderColor = "oklch(0.90 0.015 88)"; e.target.style.boxShadow = "none"; }} />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-[0.06em] mb-1.5" style={{ color: "oklch(0.58 0.018 80)", fontFamily: "var(--font-jetbrains-mono)" }}>Password</label>
                  <input type="password" value={suPassword} onChange={(e) => setSuPassword(e.target.value)} placeholder="At least 6 characters" style={inputStyle}
                    onFocus={(e) => { e.target.style.borderColor = "oklch(0.72 0.180 75)"; e.target.style.boxShadow = "0 0 0 4px oklch(0.96 0.10 90)"; }}
                    onBlur={(e) => { e.target.style.borderColor = "oklch(0.90 0.015 88)"; e.target.style.boxShadow = "none"; }} />
                </div>
                {!inviteToken && (
                <div>
                  <label className="block text-[11px] uppercase tracking-[0.06em] mb-1.5" style={{ color: "oklch(0.58 0.018 80)", fontFamily: "var(--font-jetbrains-mono)" }}>I&apos;m joining as</label>
                  <div className="grid grid-cols-3 gap-2">
                    {ROLES.map((r) => (
                      <button key={r.id} type="button" onClick={() => setSuRole(r.id)} className="p-2.5 rounded-xl text-left transition-all hover:-translate-y-px" style={{
                        border: `1px solid ${suRole === r.id ? "oklch(0.72 0.180 75)" : "oklch(0.90 0.015 88)"}`,
                        background: suRole === r.id ? "oklch(0.96 0.080 90)" : "#fff",
                        boxShadow: suRole === r.id ? "0 8px 20px -10px oklch(0.78 0.18 80 / 0.5)" : "none",
                        cursor: "pointer", fontFamily: "inherit",
                      }}>
                        <div className="text-[13px] font-medium" style={{ color: "oklch(0.18 0.018 75)" }}>{r.label}</div>
                        <div className="text-[11px] mt-0.5" style={{ color: "oklch(0.58 0.018 80)" }}>{r.sub}</div>
                      </button>
                    ))}
                  </div>
                </div>
                )}
                {suError && (
                  <div className="flex items-center gap-2 text-sm px-3 py-2 rounded-xl" style={{ background: "oklch(0.97 0.065 28)", color: "oklch(0.62 0.200 28)", border: "1px solid oklch(0.88 0.08 28)" }}>
                    <AlertCircle className="w-4 h-4 shrink-0" />{suError}
                  </div>
                )}
                <button type="submit" disabled={suLoading} className="w-full flex items-center justify-center gap-2.5 font-medium transition-all duration-200 hover:-translate-y-px disabled:opacity-60 disabled:cursor-not-allowed" style={{ padding: "12px", background: "oklch(0.136 0.022 72)", color: "#fdfaf2", borderRadius: "12px", fontSize: "14px", border: "none", boxShadow: "0 14px 30px -12px oklch(0.2 0.02 80 / 0.4)" }}>
                  {suLoading ? <span className="w-4 h-4 border-2 rounded-full border-white/30 border-t-white" style={{ animation: "spin 0.7s linear infinite" }} /> : <><span>Create account</span><ArrowRight className="w-4 h-4" /></>}
                </button>
              </form>
              <p className="mt-3 text-[11.5px]" style={{ color: "oklch(0.58 0.018 80)" }}>By signing up you agree to Atomberg&apos;s use policy.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center text-[12px]" style={{ color: "oklch(0.58 0.018 80)" }}>
          <a href="#" style={{ color: "oklch(0.40 0.020 75)", textDecoration: "none" }}>Need help?</a>
          <span style={{ fontFamily: "var(--font-jetbrains-mono)" }}>v 2026.Q2</span>
        </div>
      </main>

      {/* Microsoft Entra unavailable dialog */}
      {showEntraDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "oklch(0.10 0.015 72 / 0.55)", backdropFilter: "blur(6px)" }}
          onClick={() => setShowEntraDialog(false)}
        >
          <div
            className="relative w-full max-w-md rounded-2xl overflow-hidden"
            style={{
              background: "#fdfaf2",
              boxShadow: "0 32px 64px -16px oklch(0.12 0.02 72 / 0.45), 0 0 0 1px oklch(0.88 0.015 88)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top accent bar */}
            <div style={{ height: "3px", background: "linear-gradient(90deg, oklch(0.72 0.180 75), oklch(0.86 0.175 88))" }} />

            {/* Close */}
            <button
              onClick={() => setShowEntraDialog(false)}
              className="absolute top-4 right-4 flex items-center justify-center w-7 h-7 rounded-full transition-colors"
              style={{ background: "oklch(0.93 0.015 88)", border: "none", cursor: "pointer", color: "oklch(0.45 0.018 80)" }}
            >
              <X size={13} strokeWidth={2.5} />
            </button>

            <div style={{ padding: "32px 32px 28px" }}>
              {/* Icon */}
              <div className="flex items-center justify-center w-14 h-14 rounded-2xl mb-5" style={{ background: "oklch(0.96 0.06 92)", border: "1px solid oklch(0.88 0.10 88)" }}>
                <Frown size={26} style={{ color: "oklch(0.62 0.16 75)" }} strokeWidth={1.5} />
              </div>

              {/* Title */}
              <h3 className="font-serif m-0 mb-2" style={{ fontSize: "22px", lineHeight: "1.2", letterSpacing: "-0.015em", color: "oklch(0.18 0.018 75)" }}>
                I really wanted this to work 😞
              </h3>
              <p className="text-[13.5px] leading-relaxed mb-5" style={{ color: "oklch(0.40 0.020 75)" }}>
                Both integrations are coded. Just couldn&apos;t get them live. Here&apos;s why.
              </p>

              {/* Items */}
              <div className="space-y-3 mb-6">
                <div className="flex gap-3 p-3.5 rounded-xl" style={{ background: "oklch(0.972 0.018 92)", border: "1px solid oklch(0.90 0.015 88)" }}>
                  <svg width="16" height="16" viewBox="0 0 21 21" className="shrink-0 mt-0.5">
                    <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
                    <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
                    <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
                    <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
                  </svg>
                  <div>
                    <p className="text-[13px] font-medium m-0 mb-1" style={{ color: "oklch(0.22 0.018 75)" }}>Microsoft Entra ID SSO</p>
                    <p className="text-[12px] leading-relaxed m-0" style={{ color: "oklch(0.48 0.018 80)" }}>
                      Applied for Microsoft&apos;s free developer sandbox. Got rejected, no reason given. Azure subscription needs a credit card I don&apos;t have. The code works, just has nowhere to run. 😔
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 p-3.5 rounded-xl" style={{ background: "oklch(0.972 0.018 92)", border: "1px solid oklch(0.90 0.015 88)" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0 mt-0.5">
                    <path d="M20 6H4a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2Z" fill="#5059C9" />
                    <path d="M13 10H9v5h4v-5Z" fill="#7B83EB" />
                    <path d="M9 10H6v5h3v-5Z" fill="#5059C9" />
                  </svg>
                  <div>
                    <p className="text-[13px] font-medium m-0 mb-1" style={{ color: "oklch(0.22 0.018 75)" }}>Microsoft Teams Notifications</p>
                    <p className="text-[12px] leading-relaxed m-0" style={{ color: "oklch(0.48 0.018 80)" }}>
                      Webhooks need a real company Teams workspace. Personal accounts don&apos;t support it. I don&apos;t have company channel access, so couldn&apos;t test it. 😕
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer note */}
              <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl" style={{ background: "oklch(0.97 0.06 92)", border: "1px dashed oklch(0.82 0.12 88)" }}>
                <span style={{ fontSize: "14px", lineHeight: 1, marginTop: "1px" }}>🙏</span>
                <p className="text-[11.5px] leading-relaxed m-0" style={{ color: "oklch(0.42 0.06 80)" }}>
                  Rest of the app is fully working. Try the{" "}
                  <strong style={{ color: "oklch(0.30 0.08 78)", fontWeight: 600 }}>demo accounts</strong>{" "}
                  below, I promise it won&apos;t disappoint.
                </p>
              </div>

              {/* Close CTA */}
              <button
                onClick={() => setShowEntraDialog(false)}
                className="w-full mt-5 flex items-center justify-center gap-2 font-medium transition-all hover:-translate-y-px"
                style={{ padding: "13px", background: "oklch(0.136 0.022 72)", color: "#fdfaf2", borderRadius: "12px", fontSize: "14px", border: "none", cursor: "pointer", fontFamily: "inherit", boxShadow: "0 10px 24px -10px oklch(0.2 0.02 80 / 0.4)" }}
              >
                Got it, show me the app
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}
