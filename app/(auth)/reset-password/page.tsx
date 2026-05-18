"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

function ResetForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError("Passwords don't match"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    setLoading(false);
    if (res.ok) router.push("/login?reset=1");
    else {
      const data = await res.json();
      setError(data.error ?? "Invalid or expired link");
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "13px 15px", borderRadius: "10px",
    border: "1px solid oklch(0.90 0.015 88)", background: "#fff",
    fontSize: "14px", outline: "none", boxSizing: "border-box",
    fontFamily: "inherit", color: "oklch(0.18 0.018 75)",
  };

  if (!token) return (
    <p style={{ textAlign: "center", fontSize: "14px", color: "oklch(0.55 0.18 28)" }}>
      Invalid reset link. <Link href="/forgot-password" style={{ color: "oklch(0.72 0.180 75)" }}>Request a new one</Link>
    </p>
  );

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div>
        <label style={{ display: "block", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.06em", color: "oklch(0.58 0.018 80)", fontFamily: "var(--font-jetbrains-mono)", marginBottom: "8px" }}>New password</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 6 characters" required minLength={6} style={inputStyle} />
      </div>
      <div>
        <label style={{ display: "block", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.06em", color: "oklch(0.58 0.018 80)", fontFamily: "var(--font-jetbrains-mono)", marginBottom: "8px" }}>Confirm password</label>
        <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Repeat password" required style={inputStyle} />
      </div>
      {error && <p style={{ fontSize: "13px", color: "oklch(0.55 0.18 28)", margin: 0 }}>{error}</p>}
      <button type="submit" disabled={loading} style={{ padding: "13px", background: "oklch(0.136 0.022 72)", color: "#fdfaf2", border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit", opacity: loading ? 0.6 : 1 }}>
        {loading ? "Saving…" : "Set new password"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#f9f6ee", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ width: "100%", maxWidth: "400px" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <Image src="/atomberg-logo.png" alt="AtomQuest" width={40} height={40} style={{ borderRadius: "10px", margin: "0 auto 12px" }} />
          <h1 style={{ fontFamily: "var(--font-instrument-serif)", fontSize: "26px", fontWeight: 400, margin: "0 0 6px", color: "oklch(0.14 0.018 75)" }}>Set new password</h1>
          <p style={{ fontSize: "13px", color: "oklch(0.55 0.018 80)", margin: 0 }}>Choose a strong password for your account</p>
        </div>
        <div style={{ background: "#fff", borderRadius: "16px", padding: "28px 24px", border: "1px solid oklch(0.90 0.015 88)", boxShadow: "0 4px 24px -8px oklch(0.4 0.02 80 / 0.10)" }}>
          <Suspense fallback={<p style={{ textAlign: "center", fontSize: "14px" }}>Loading…</p>}>
            <ResetForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
