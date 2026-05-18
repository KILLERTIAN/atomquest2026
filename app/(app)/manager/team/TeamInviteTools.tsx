"use client";

import { useState } from "react";
import { Panel, Icon } from "@/components/app/ui";
import { toast } from "sonner";

export function TeamInviteTools() {
  const [inviteLink, setInviteLink] = useState("");
  const [generating, setGenerating] = useState(false);

  const [bulkEmails, setBulkEmails] = useState("");
  const [bulking, setBulking] = useState(false);

  const [resendEmail, setResendEmail] = useState("");
  const [resending, setResending] = useState(false);

  async function generateLink() {
    setGenerating(true);
    try {
      const res = await fetch("/api/invites/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const d = await res.json();
      if (res.ok) {
        setInviteLink(d.inviteUrl);
        navigator.clipboard.writeText(d.inviteUrl).catch(() => {});
        toast.success("Invite link copied to clipboard");
      } else {
        toast.error("Failed to generate link");
      }
    } finally { setGenerating(false); }
  }

  async function handleBulkInvite() {
    const emails = bulkEmails.split(/[\n,;]+/).map((e) => e.trim()).filter(Boolean);
    if (emails.length === 0) { toast.error("Enter at least one email"); return; }
    setBulking(true);
    try {
      const res = await fetch("/api/invites/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails }),
      });
      const d = await res.json();
      if (res.ok) {
        toast.success(`${d.created} invite${d.created !== 1 ? "s" : ""} sent${d.failed?.length ? `, ${d.failed.length} skipped` : ""}`);
        setBulkEmails("");
      } else {
        toast.error(d.error ?? "Failed");
      }
    } finally { setBulking(false); }
  }

  async function handleResend() {
    const email = resendEmail.trim();
    if (!email) { toast.error("Enter an email address"); return; }
    setResending(true);
    try {
      const res = await fetch("/api/invites/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails: [email], force: true }),
      });
      const d = await res.json();
      if (res.ok) {
        toast.success(`Invite resent to ${email}`);
        setResendEmail("");
      } else {
        toast.error(d.error ?? "Failed to resend");
      }
    } finally { setResending(false); }
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
      {/* Deep-link invite */}
      <Panel title="Invite link" sub="Share URL — new signups auto-join your team">
        <div className="space-y-3">
          <p style={{ fontSize: "13px", color: "var(--ink-mute)", lineHeight: 1.6, margin: 0 }}>
            Anyone who signs up via your invite link is automatically assigned to you as a direct report.
          </p>
          {inviteLink && (
            <div style={{ background: "var(--bg-elev)", border: "1px solid var(--line)", borderRadius: "10px", padding: "10px 14px", fontFamily: "var(--font-jetbrains-mono)", fontSize: "11.5px", color: "var(--ink-mute)", wordBreak: "break-all", userSelect: "all" }}>
              {inviteLink}
            </div>
          )}
          <div style={{ display: "flex", gap: "8px" }}>
            <button className="btn-primary" onClick={generateLink} disabled={generating} style={{ flex: 1, justifyContent: "center" }}>
              {generating ? "Generating…" : <><Icon name="link" size={13} /> {inviteLink ? "Regenerate" : "Generate link"}</>}
            </button>
            {inviteLink && (
              <button className="btn-ghost" onClick={() => { navigator.clipboard.writeText(inviteLink); toast.success("Copied"); }}>
                <Icon name="copy" size={13} />
              </button>
            )}
          </div>
        </div>
      </Panel>

      {/* Bulk email invite */}
      <Panel title="Bulk invite by email" sub="Invited employees auto-join your team">
        <div className="space-y-3">
          <textarea
            value={bulkEmails}
            onChange={(e) => setBulkEmails(e.target.value)}
            placeholder={"alice@atomberg.com\nbob@atomberg.com"}
            rows={4}
            style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid var(--line-strong)", background: "var(--bg)", fontSize: "13px", color: "var(--ink)", outline: "none", resize: "vertical", fontFamily: "var(--font-jetbrains-mono)" }}
          />
          <button className="btn-primary w-full" onClick={handleBulkInvite} disabled={bulking} style={{ justifyContent: "center" }}>
            {bulking ? "Sending…" : <><Icon name="mail" size={13} /> Send invites</>}
          </button>

          {/* Resend */}
          <div style={{ borderTop: "1px solid var(--line)", paddingTop: "12px" }}>
            <p style={{ fontSize: "11.5px", color: "var(--ink-mute)", margin: "0 0 8px", fontWeight: 500 }}>Resend invite</p>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                type="email"
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                placeholder="someone@atomberg.com"
                style={{ flex: 1, padding: "8px 10px", borderRadius: "8px", border: "1px solid var(--line-strong)", background: "var(--bg)", fontSize: "13px", color: "var(--ink)", outline: "none", fontFamily: "var(--font-jetbrains-mono)" }}
              />
              <button className="btn-ghost" onClick={handleResend} disabled={resending} style={{ whiteSpace: "nowrap" }}>
                {resending ? "…" : <><Icon name="mail" size={13} /> Resend</>}
              </button>
            </div>
          </div>
        </div>
      </Panel>
    </div>
  );
}
