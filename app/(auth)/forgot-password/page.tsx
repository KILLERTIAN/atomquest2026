"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    if (res.ok) setSent(true);
    else setError("Something went wrong. Try again.");
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "13px 15px", borderRadius: "10px",
    border: "1px solid oklch(0.90 0.015 88)", background: "#fff",
    fontSize: "14px", outline: "none", boxSizing: "border-box",
    fontFamily: "inherit", color: "oklch(0.18 0.018 75)",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f9f6ee", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ width: "100%", maxWidth: "400px" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <Image src="/atomberg-logo.png" alt="AtomQuest" width={40} height={40} style={{ borderRadius: "10px", margin: "0 auto 12px" }} />
          <h1 style={{ fontFamily: "var(--font-instrument-serif)", fontSize: "26px", fontWeight: 400, margin: "0 0 6px", color: "oklch(0.14 0.018 75)" }}>Reset password</h1>
          <p style={{ fontSize: "13px", color: "oklch(0.55 0.018 80)", margin: 0 }}>Enter your email and we'll send a reset link</p>
        </div>

        <div style={{ background: "#fff", borderRadius: "16px", padding: "28px 24px", border: "1px solid oklch(0.90 0.015 88)", boxShadow: "0 4px 24px -8px oklch(0.4 0.02 80 / 0.10)" }}>
          {sent ? (
            <div style={{ textAlign: "center", padding: "8px 0" }}>
              <div style={{ width: "48px", height: "48px", background: "oklch(0.94 0.08 150)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <Mail size={22} color="oklch(0.40 0.12 150)" />
              </div>
              <h2 style={{ fontSize: "16px", fontWeight: 600, margin: "0 0 8px", color: "oklch(0.18 0.018 75)" }}>Check your inbox</h2>
              <p style={{ fontSize: "13px", color: "oklch(0.55 0.018 80)", margin: "0 0 20px", lineHeight: 1.6 }}>
                If <strong>{email}</strong> has an account, a reset link is on its way. Check spam if you don't see it.
              </p>
              <Link href="/login" style={{ fontSize: "13px", color: "oklch(0.72 0.180 75)", textDecoration: "none", fontWeight: 500 }}>← Back to sign in</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.06em", color: "oklch(0.58 0.018 80)", fontFamily: "var(--font-jetbrains-mono)", marginBottom: "8px" }}>Email address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@atomberg.com" required style={inputStyle} />
              </div>
              {error && <p style={{ fontSize: "13px", color: "oklch(0.55 0.18 28)", margin: 0 }}>{error}</p>}
              <button type="submit" disabled={loading} style={{ padding: "13px", background: "oklch(0.136 0.022 72)", color: "#fdfaf2", border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit", opacity: loading ? 0.6 : 1 }}>
                {loading ? "Sending…" : "Send reset link"}
              </button>
              <Link href="/login" style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "oklch(0.55 0.018 80)", textDecoration: "none", justifyContent: "center" }}>
                <ArrowLeft size={13} /> Back to sign in
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
