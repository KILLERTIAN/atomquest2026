"use client";

import { useEffect, useState } from "react";
import { Panel, PageHeader, Avatar, FilterPills, Icon, ThemedSelect, FormField } from "@/components/app/ui";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

interface User {
  id: string; name: string; email: string; role: string;
  manager: { id: string; name: string } | null;
  department: { id?: string; name: string } | null;
}

interface Dept { id: string; name: string; }

const ROLE_PILL: Record<string, { bg: string; color: string }> = {
  ADMIN:    { bg: "oklch(0.94 0.06 290)", color: "oklch(0.40 0.12 290)" },
  MANAGER:  { bg: "oklch(0.95 0.05 240)", color: "oklch(0.40 0.12 240)" },
  EMPLOYEE: { bg: "oklch(0.95 0.01 80)",  color: "oklch(0.50 0.02 80)" },
};
const AVATR_TONE: Record<string, string> = {
  ADMIN: "oklch(0.90 0.08 290)", MANAGER: "oklch(0.90 0.06 240)", EMPLOYEE: "oklch(0.92 0.08 92)",
};
const ROLE_FILTERS = [
  { value: "all", label: "All" }, { value: "ADMIN", label: "Admin" },
  { value: "MANAGER", label: "Manager" }, { value: "EMPLOYEE", label: "Employee" },
];

const DEMO_USERS: User[] = [
  { id: "u1",  name: "Admin User",     email: "admin@demo.com",         role: "ADMIN",    manager: null,                                   department: { name: "Engineering" } },
  { id: "u2",  name: "Riya Menon",     email: "riya@atomberg.com",       role: "MANAGER",  manager: { id: "u1", name: "Admin User" },        department: { name: "R&D" } },
  { id: "u3",  name: "Vikas Talwar",   email: "vikas@atomberg.com",      role: "MANAGER",  manager: { id: "u1", name: "Admin User" },        department: { name: "Product" } },
  { id: "u4",  name: "Sneha Iyer",     email: "sneha@atomberg.com",      role: "MANAGER",  manager: { id: "u1", name: "Admin User" },        department: { name: "Quality" } },
  { id: "u5",  name: "Anika Sharma",   email: "anika@atomberg.com",      role: "EMPLOYEE", manager: { id: "u2", name: "Riya Menon" },        department: { name: "R&D" } },
  { id: "u6",  name: "Karan Verma",    email: "karan@atomberg.com",      role: "EMPLOYEE", manager: { id: "u2", name: "Riya Menon" },        department: { name: "R&D" } },
  { id: "u7",  name: "Devika Pillai",  email: "devika@atomberg.com",     role: "EMPLOYEE", manager: { id: "u2", name: "Riya Menon" },        department: { name: "Quality" } },
  { id: "u8",  name: "Hiren Thakur",   email: "hiren@atomberg.com",      role: "EMPLOYEE", manager: { id: "u2", name: "Riya Menon" },        department: { name: "R&D" } },
  { id: "u9",  name: "Mira Kapoor",    email: "mira@atomberg.com",       role: "EMPLOYEE", manager: { id: "u3", name: "Vikas Talwar" },      department: { name: "Product" } },
  { id: "u10", name: "Sahil Bose",     email: "sahil@atomberg.com",      role: "EMPLOYEE", manager: { id: "u3", name: "Vikas Talwar" },      department: { name: "Product" } },
  { id: "u11", name: "Rhea Nair",      email: "rhea@atomberg.com",       role: "EMPLOYEE", manager: { id: "u4", name: "Sneha Iyer" },        department: { name: "Quality" } },
  { id: "u12", name: "John Employee",  email: "emp@demo.com",            role: "EMPLOYEE", manager: { id: "u2", name: "Riya Menon" },        department: { name: "Engineering" } },
  { id: "u13", name: "Sarah Manager",  email: "manager@demo.com",        role: "MANAGER",  manager: { id: "u1", name: "Admin User" },        department: { name: "Engineering" } },
];

const DEMO_TEAMS_USERS = [
  { name: "Priya Nambiar",   email: "priya@atomberg.com",   title: "Senior Engineer" },
  { name: "Arjun Mehta",     email: "arjun@atomberg.com",   title: "Product Designer" },
  { name: "Tanya Srivastava",email: "tanya@atomberg.com",   title: "QA Lead" },
  { name: "Rohan Das",       email: "rohan@atomberg.com",   title: "DevOps Engineer" },
  { name: "Meera Pillai",    email: "meera@atomberg.com",   title: "Data Analyst" },
];

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "EMPLOYEE", managerId: "", departmentId: "" });
  const [saving, setSaving] = useState(false);
  const [departments, setDepartments] = useState<Dept[]>([]);

  // Edit user
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", role: "", managerId: "", departmentId: "" });
  const [editing, setEditing] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [resending, setResending] = useState(false);

  // Bulk invite
  const [bulkEmails, setBulkEmails] = useState("");
  const [bulkManagerId, setBulkManagerId] = useState("");
  const [bulking, setBulking] = useState(false);

  // Teams import
  const [teamsOpen, setTeamsOpen] = useState(false);
  const [teamsSelected, setTeamsSelected] = useState<Set<number>>(new Set());
  const [teamsManagerId, setTeamsManagerId] = useState("");
  const [teamsImporting, setTeamsImporting] = useState(false);

  // Invite link
  const [inviteLink, setInviteLink] = useState("");
  const [generatingLink, setGeneratingLink] = useState(false);

  useEffect(() => {
    fetch("/api/users").then((r) => r.json()).then((d) => {
      setUsers(Array.isArray(d) ? d : DEMO_USERS);
    }).catch(() => { setUsers(DEMO_USERS); }).finally(() => setLoading(false));
    fetch("/api/departments").then((r) => r.json()).then((d) => { if (Array.isArray(d)) setDepartments(d); }).catch(() => {});
  }, []);

  async function handleCreate() {
    setSaving(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, managerId: form.managerId || null, departmentId: form.departmentId || null }),
      });
      if (res.ok) {
        toast.success("User created");
        setOpen(false);
        setForm({ name: "", email: "", password: "", role: "EMPLOYEE", managerId: "", departmentId: "" });
        fetch("/api/users").then((r) => r.json()).then((d) => { if (d?.length > 0) setUsers(d); });
      } else {
        const err = await res.json();
        toast.error(String(err?.error ?? "Failed to create user"));
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteUser() {
    if (!editUser) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/users/${editUser.id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success(`${editUser.name} deleted`);
        setEditUser(null);
        setDeleteConfirm(false);
        setUsers((prev) => prev.filter((u) => u.id !== editUser.id));
      } else {
        const e = await res.json();
        toast.error(e.error ?? "Delete failed");
      }
    } finally { setDeleting(false); }
  }

  async function handleResendInvite() {
    if (!editUser) return;
    setResending(true);
    try {
      const res = await fetch("/api/invites/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails: [editUser.email], force: true }),
      });
      if (res.ok) toast.success(`Invite resent to ${editUser.email}`);
      else { const e = await res.json(); toast.error(e.error ?? "Failed to resend"); }
    } finally { setResending(false); }
  }

  function openEdit(u: User) {
    setDeleteConfirm(false);
    setEditUser(u);
    setEditForm({
      name: u.name,
      email: u.email,
      role: u.role,
      managerId: u.manager?.id ?? "",
      departmentId: u.department?.id ?? "",
    });
  }

  async function handleEditUser() {
    if (!editUser) return;
    setEditing(true);
    try {
      const res = await fetch(`/api/users/${editUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name,
          email: editForm.email,
          role: editForm.role,
          managerId: editForm.managerId === "none" || !editForm.managerId ? null : editForm.managerId,
          departmentId: editForm.departmentId === "none" || !editForm.departmentId ? null : editForm.departmentId,
        }),
      });
      if (res.ok) {
        toast.success(`${editUser.name} updated`);
        setEditUser(null);
        fetch("/api/users").then((r) => r.json()).then((d) => { if (Array.isArray(d)) setUsers(d); });
      } else {
        const e = await res.json();
        toast.error(e.error ?? "Failed");
      }
    } finally { setEditing(false); }
  }

  async function handleBulkInvite() {
    const emails = bulkEmails.split(/[\n,;]+/).map((e) => e.trim()).filter(Boolean);
    if (emails.length === 0) { toast.error("Enter at least one email"); return; }
    setBulking(true);
    try {
      const res = await fetch("/api/invites/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails, managerId: bulkManagerId || null }),
      });
      const d = await res.json();
      if (res.ok) {
        toast.success(`${d.created} account${d.created !== 1 ? "s" : ""} created${d.failed?.length ? `, ${d.failed.length} skipped` : ""}`);
        setBulkEmails(""); setBulkManagerId("");
        fetch("/api/users").then((r) => r.json()).then((dd) => { if (Array.isArray(dd)) setUsers(dd); });
      } else toast.error(d.error ?? "Bulk invite failed");
    } finally { setBulking(false); }
  }

  async function handleTeamsImport() {
    const selected = DEMO_TEAMS_USERS.filter((_, i) => teamsSelected.has(i));
    if (selected.length === 0) { toast.error("Select at least one person"); return; }
    setTeamsImporting(true);
    try {
      const res = await fetch("/api/invites/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails: selected.map((u) => u.email), managerId: teamsManagerId || null }),
      });
      const d = await res.json();
      if (res.ok) {
        toast.success(`${d.created} imported from Teams`);
        setTeamsOpen(false); setTeamsSelected(new Set());
        fetch("/api/users").then((r) => r.json()).then((dd) => { if (Array.isArray(dd)) setUsers(dd); });
      } else toast.error(d.error ?? "Import failed");
    } finally { setTeamsImporting(false); }
  }

  async function generateInviteLink(managerId: string) {
    setGeneratingLink(true);
    try {
      const res = await fetch("/api/invites/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
      const d = await res.json();
      if (res.ok) { setInviteLink(d.inviteUrl); navigator.clipboard.writeText(d.inviteUrl).catch(() => {}); toast.success("Invite link copied to clipboard"); }
      else toast.error("Failed to generate link");
    } finally { setGeneratingLink(false); }
  }

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const managers = users.filter((u) => u.role === "MANAGER" || u.role === "ADMIN");
  const filtered = users.filter((u) => {
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    return matchRole && matchSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <div className="space-y-5 fade-up">
      <PageHeader
        eyebrow="admin · users"
        title="User management."
        lede={`${users.length} users · ${managers.length} managers · manage accounts, roles, and team assignments`}
        actions={
          <button className="btn-primary" onClick={() => setOpen(true)}>
            <Icon name="plus" size={14} /> Add user
          </button>
        }
      />

      {/* Search + filter bar — outside Panel to avoid overflow:hidden clipping */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: "1 1 220px", maxWidth: "320px" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--ink-mute)", pointerEvents: "none" }}>
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name or email…"
            style={{ paddingLeft: "32px", paddingRight: "12px", height: "36px", width: "100%", borderRadius: "10px", border: "1px solid var(--line-strong)", background: "var(--surface-card)", fontSize: "13px", color: "var(--ink)", outline: "none", boxSizing: "border-box" }}
          />
        </div>
        <FilterPills options={ROLE_FILTERS} active={roleFilter} onChange={(v) => { setRoleFilter(v); setPage(1); }} />
        <div style={{ display: "flex", alignItems: "center", gap: "5px", marginLeft: "auto" }}>
          <span style={{ fontSize: "11.5px", color: "var(--ink-mute)", fontFamily: "var(--font-jetbrains-mono)", whiteSpace: "nowrap" }}>Show</span>
          <ThemedSelect
            value={String(pageSize)}
            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
            options={[{ value: "10", label: "10" }, { value: "25", label: "25" }, { value: "50", label: "50" }]}
            style={{ padding: "3px 6px", fontSize: "12px", minWidth: "56px" }}
          />
        </div>
      </div>

      <Panel
        title={`${filtered.length} user${filtered.length !== 1 ? "s" : ""}${search ? ` matching "${search}"` : ""}`}
        sub={roleFilter !== "all" ? `Filtered by ${roleFilter.toLowerCase()}` : "All roles"}
        noPadding
      >

        <table className="audit-tbl">
          <thead>
            <tr><th>User</th><th>Role</th><th>Manager</th><th>Department</th><th></th></tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={5} style={{ textAlign: "center", padding: "48px", color: "var(--ink-mute)", fontFamily: "var(--font-jetbrains-mono)", fontSize: "13px" }}>Loading…</td></tr>
            )}
            {!loading && paginated.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: "center", padding: "48px", color: "var(--ink-mute)", fontFamily: "var(--font-jetbrains-mono)", fontSize: "13px" }}>No users found</td></tr>
            )}
            {!loading && paginated.map((u) => {
              const pill = ROLE_PILL[u.role] ?? ROLE_PILL.EMPLOYEE;
              const tone = AVATR_TONE[u.role] ?? "oklch(0.92 0.08 92)";
              return (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <Avatar name={u.name} tone={tone} size={32} />
                      <div>
                        <div style={{ fontWeight: 500, fontSize: "13.5px" }}>{u.name}</div>
                        <div className="font-mono text-xs" style={{ color: "var(--ink-mute)" }}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="pill" style={{ background: pill.bg, color: pill.color }}>{u.role.toLowerCase()}</span></td>
                  <td className="text-sm" style={{ color: "var(--ink-mute)" }}>{u.manager?.name ?? "—"}</td>
                  <td className="text-sm" style={{ color: "var(--ink-mute)" }}>{u.department?.name ?? "—"}</td>
                  <td>
                    <button
                      onClick={() => openEdit(u)}
                      style={{ fontSize: "12px", padding: "5px 12px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--surface-card)", color: "var(--ink-mute)", cursor: "pointer", fontFamily: "inherit", fontWeight: 500 }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--brand)"; (e.currentTarget as HTMLElement).style.color = "var(--ink)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--line)"; (e.currentTarget as HTMLElement).style.color = "var(--ink-mute)"; }}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Pagination footer */}
        {!loading && filtered.length > pageSize && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderTop: "1px solid var(--line)" }}>
            <span style={{ fontSize: "12px", color: "var(--ink-mute)", fontFamily: "var(--font-jetbrains-mono)" }}>
              {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, filtered.length)} of {filtered.length}
            </span>
            <div style={{ display: "flex", gap: "4px" }}>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                style={{ padding: "5px 10px", borderRadius: "7px", border: "1px solid var(--line)", background: "var(--surface-card)", fontSize: "12px", color: safePage === 1 ? "var(--ink-mute)" : "var(--ink)", cursor: safePage === 1 ? "default" : "pointer" }}
              >← Prev</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => Math.abs(p - safePage) <= 2 || p === 1 || p === totalPages).map((p, idx, arr) => (
                <span key={p}>
                  {idx > 0 && arr[idx - 1] !== p - 1 && <span style={{ padding: "5px 4px", fontSize: "12px", color: "var(--ink-mute)" }}>…</span>}
                  <button
                    onClick={() => setPage(p)}
                    style={{ padding: "5px 10px", borderRadius: "7px", border: `1px solid ${p === safePage ? "var(--brand)" : "var(--line)"}`, background: p === safePage ? "oklch(0.97 0.04 80)" : "var(--surface-card)", fontSize: "12px", color: p === safePage ? "var(--brand-deep)" : "var(--ink)", cursor: "pointer", fontWeight: p === safePage ? 600 : 400 }}
                  >{p}</button>
                </span>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                style={{ padding: "5px 10px", borderRadius: "7px", border: "1px solid var(--line)", background: "var(--surface-card)", fontSize: "12px", color: safePage === totalPages ? "var(--ink-mute)" : "var(--ink)", cursor: safePage === totalPages ? "default" : "pointer" }}
              >Next →</button>
            </div>
          </div>
        )}
      </Panel>

      {/* ── Invite tools row ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        {/* Bulk invite by email */}
        <Panel title="Bulk invite by email" sub="Paste emails — one per line or comma-separated">
          <div className="space-y-3">
            <textarea
              value={bulkEmails}
              onChange={(e) => setBulkEmails(e.target.value)}
              placeholder={"alice@atomberg.com\nbob@atomberg.com"}
              rows={5}
              style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid var(--line-strong)", background: "var(--bg)", fontSize: "13px", color: "var(--ink)", outline: "none", resize: "vertical", fontFamily: "var(--font-jetbrains-mono)" }}
            />
            <FormField label="Assign to manager">
              <ThemedSelect
                value={bulkManagerId || "none"}
                onChange={(e) => setBulkManagerId(e.target.value === "none" ? "" : e.target.value)}
                options={[{ value: "none", label: "No manager (assign later)" }, ...managers.map((m) => ({ value: m.id, label: m.name }))]}
              />
            </FormField>
            <div style={{ display: "flex", gap: "8px" }}>
              <button className="btn-primary" onClick={handleBulkInvite} disabled={bulking} style={{ flex: 1, justifyContent: "center" }}>
                {bulking ? "Sending…" : <><Icon name="mail" size={13} /> Send invites</>}
              </button>
              <button className="btn-ghost" onClick={() => setTeamsOpen(true)} style={{ gap: "6px" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ opacity: 0.7 }}><path d="M19.19 8.77A4.5 4.5 0 0 0 21 5.25C21 2.9 19.1 1 16.75 1c-1.3 0-2.45.56-3.25 1.44A4.5 4.5 0 0 0 10.25 1C7.9 1 6 2.9 6 5.25c0 1.42.66 2.68 1.68 3.51L2 14h4v7h6v-4h2v4h6v-7h4l-5.81-5.23z"/></svg>
                Import from Teams
              </button>
            </div>
          </div>
        </Panel>

        {/* Invite deep-link generator */}
        <Panel title="Manager invite link" sub="Share a link — new signups auto-join your team">
          <div className="space-y-3">
            <p style={{ fontSize: "13px", color: "var(--ink-mute)", lineHeight: 1.6 }}>
              Generate a unique invite URL. Anyone who signs up via this link is automatically assigned to you as a direct report.
            </p>
            {inviteLink && (
              <div style={{ background: "var(--bg-elev)", border: "1px solid var(--line)", borderRadius: "10px", padding: "10px 14px", fontFamily: "var(--font-jetbrains-mono)", fontSize: "11.5px", color: "var(--ink-mute)", wordBreak: "break-all", userSelect: "all" }}>
                {inviteLink}
              </div>
            )}
            <div style={{ display: "flex", gap: "8px" }}>
              <button className="btn-primary" onClick={() => generateInviteLink("")} disabled={generatingLink} style={{ flex: 1, justifyContent: "center" }}>
                {generatingLink ? "Generating…" : <><Icon name="link" size={13} /> {inviteLink ? "Regenerate link" : "Generate link"}</>}
              </button>
              {inviteLink && (
                <button className="btn-ghost" onClick={() => { navigator.clipboard.writeText(inviteLink); toast.success("Copied"); }}>
                  <Icon name="copy" size={13} />
                </button>
              )}
            </div>
            {inviteLink && (
              <p style={{ fontSize: "11.5px", color: "var(--ink-mute)", margin: 0 }}>
                Link copied to clipboard. Share it with new team members.
              </p>
            )}
          </div>
        </Panel>
      </div>

      {/* ── Edit user dialog ── */}
      <Dialog open={!!editUser} onOpenChange={(o) => { if (!o) setEditUser(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl font-normal">Edit user</DialogTitle>
          </DialogHeader>
          {editUser && (
            <div className="space-y-4 pt-2">
              <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px", background: "var(--bg-elev)", borderRadius: "10px" }}>
                <Avatar name={editUser.name} tone={AVATR_TONE[editUser.role] ?? "oklch(0.92 0.08 92)"} size={36} />
                <div>
                  <div style={{ fontWeight: 500, fontSize: "13.5px" }}>{editUser.name}</div>
                  <div className="font-mono text-xs" style={{ color: "var(--ink-mute)" }}>{editUser.email}</div>
                </div>
              </div>

              {(["name", "email"] as const).map((f) => (
                <label key={f} className="block">
                  <span style={{ fontSize: "11.5px", fontFamily: "var(--font-jetbrains-mono)", color: "var(--ink-mute)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{f}</span>
                  <input value={editForm[f]} onChange={(e) => setEditForm((p) => ({ ...p, [f]: e.target.value }))}
                    style={{ marginTop: "6px", width: "100%", padding: "9px 12px", borderRadius: "10px", border: "1px solid var(--line-strong)", background: "var(--bg)", fontSize: "13.5px", color: "var(--ink)", outline: "none", display: "block" }} />
                </label>
              ))}

              <FormField label="Role">
                <ThemedSelect
                  value={editForm.role}
                  onChange={(e) => setEditForm((p) => ({ ...p, role: e.target.value }))}
                  options={[{ value: "EMPLOYEE", label: "Employee" }, { value: "MANAGER", label: "Manager" }, { value: "ADMIN", label: "Admin" }]}
                />
              </FormField>

              <FormField label="Reporting manager">
                <ThemedSelect
                  value={editForm.managerId || "none"}
                  onChange={(e) => setEditForm((p) => ({ ...p, managerId: e.target.value === "none" ? "" : e.target.value }))}
                  options={[
                    { value: "none", label: "No manager" },
                    ...managers.filter((m) => m.id !== editUser.id).map((m) => ({ value: m.id, label: `${m.name} · ${m.role.toLowerCase()}` })),
                  ]}
                />
              </FormField>

              {departments.length > 0 && (
                <FormField label="Department">
                  <ThemedSelect
                    value={editForm.departmentId || "none"}
                    onChange={(e) => setEditForm((p) => ({ ...p, departmentId: e.target.value === "none" ? "" : e.target.value }))}
                    options={[{ value: "none", label: "No department" }, ...departments.map((d) => ({ value: d.id, label: d.name }))]}
                  />
                </FormField>
              )}

              <div style={{ display: "flex", gap: "8px", paddingTop: "4px" }}>
                <button className="btn-primary" onClick={handleEditUser} disabled={editing} style={{ flex: 1, justifyContent: "center" }}>
                  {editing ? "Saving…" : "Save changes"}
                </button>
                <button className="btn-ghost" onClick={() => setEditUser(null)}>Cancel</button>
              </div>

              <button
                onClick={handleResendInvite}
                disabled={resending}
                style={{ width: "100%", padding: "9px 12px", borderRadius: "10px", border: "1px solid var(--line)", background: "var(--bg)", color: "var(--ink-mute)", fontSize: "13px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--brand)"; (e.currentTarget as HTMLElement).style.color = "var(--ink)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--line)"; (e.currentTarget as HTMLElement).style.color = "var(--ink-mute)"; }}
              >
                <Icon name="mail" size={13} />
                {resending ? "Sending…" : "Resend invite email"}
              </button>

              {!deleteConfirm ? (
                <button
                  onClick={() => setDeleteConfirm(true)}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "10px", border: "1px solid oklch(0.85 0.06 25)", background: "oklch(0.97 0.02 25)", color: "oklch(0.45 0.12 25)", fontSize: "13px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "oklch(0.93 0.06 25)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "oklch(0.97 0.02 25)"; }}
                >
                  Delete account
                </button>
              ) : (
                <div style={{ padding: "12px", background: "oklch(0.96 0.03 25)", borderRadius: "10px", border: "1px solid oklch(0.85 0.06 25)" }}>
                  <p style={{ margin: "0 0 10px", fontSize: "13px", color: "oklch(0.35 0.10 25)", fontWeight: 500 }}>
                    Delete <strong>{editUser?.name}</strong>? This removes all their goals, check-ins, and data permanently.
                  </p>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={handleDeleteUser}
                      disabled={deleting}
                      style={{ flex: 1, padding: "8px 12px", borderRadius: "8px", border: "none", background: "oklch(0.50 0.14 25)", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
                    >
                      {deleting ? "Deleting…" : "Yes, delete"}
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(false)}
                      style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--bg)", fontSize: "13px", cursor: "pointer" }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Teams import dialog ── */}
      <Dialog open={teamsOpen} onOpenChange={setTeamsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl font-normal">Import from Microsoft Teams</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p style={{ fontSize: "13px", color: "var(--ink-mute)", margin: 0 }}>Select team members to import as employees.</p>
            <div className="space-y-2">
              {DEMO_TEAMS_USERS.map((u, i) => (
                <label key={i} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 12px", borderRadius: "10px", border: `1px solid ${teamsSelected.has(i) ? "var(--brand)" : "var(--line)"}`, background: teamsSelected.has(i) ? "oklch(0.97 0.04 80)" : "var(--bg)", cursor: "pointer", transition: "all 0.15s" }}>
                  <input type="checkbox" checked={teamsSelected.has(i)} onChange={(e) => {
                    const next = new Set(teamsSelected);
                    if (e.target.checked) next.add(i); else next.delete(i);
                    setTeamsSelected(next);
                  }} style={{ accentColor: "var(--brand)", width: "15px", height: "15px" }} />
                  <Avatar name={u.name} tone="oklch(0.90 0.06 240)" size={30} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "13.5px", fontWeight: 500 }}>{u.name}</div>
                    <div className="font-mono text-xs" style={{ color: "var(--ink-mute)" }}>{u.title} · {u.email}</div>
                  </div>
                </label>
              ))}
            </div>
            <FormField label="Assign to manager">
              <ThemedSelect
                value={teamsManagerId || "none"}
                onChange={(e) => setTeamsManagerId(e.target.value === "none" ? "" : e.target.value)}
                options={[{ value: "none", label: "No manager (assign later)" }, ...managers.map((m) => ({ value: m.id, label: m.name }))]}
              />
            </FormField>
            <div style={{ display: "flex", gap: "8px" }}>
              <button className="btn-primary" onClick={handleTeamsImport} disabled={teamsImporting || teamsSelected.size === 0} style={{ flex: 1, justifyContent: "center" }}>
                {teamsImporting ? "Importing…" : `Import ${teamsSelected.size > 0 ? teamsSelected.size : ""} selected`}
              </button>
              <button className="btn-ghost" onClick={() => { setTeamsOpen(false); setTeamsSelected(new Set()); }}>Cancel</button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Add new user dialog ── */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl font-normal">Add new user</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {(["name", "email", "password"] as const).map((f) => (
              <label key={f} className="block">
                <span style={{ fontSize: "11.5px", fontFamily: "var(--font-jetbrains-mono)", color: "var(--ink-mute)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{f}</span>
                <input type={f === "password" ? "password" : "text"} value={form[f]} onChange={(e) => setForm((p) => ({ ...p, [f]: e.target.value }))}
                  placeholder={f === "email" ? "user@atomberg.com" : f === "password" ? "Min 6 chars" : "Full name"}
                  style={{ marginTop: "6px", width: "100%", padding: "9px 12px", borderRadius: "10px", border: "1px solid var(--line-strong)", background: "var(--bg)", fontSize: "13.5px", color: "var(--ink)", outline: "none", display: "block" }} />
              </label>
            ))}
            <FormField label="Role">
              <ThemedSelect
                value={form.role}
                onChange={(e) => setForm((p) => ({ ...p, role: e.target.value, managerId: "" }))}
                options={[{ value: "EMPLOYEE", label: "Employee" }, { value: "MANAGER", label: "Manager" }, { value: "ADMIN", label: "Admin" }]}
              />
            </FormField>
            {form.role === "EMPLOYEE" && managers.length > 0 && (
              <FormField label="Reporting manager">
                <ThemedSelect
                  value={form.managerId || "none"}
                  onChange={(e) => setForm((p) => ({ ...p, managerId: e.target.value === "none" ? "" : e.target.value }))}
                  options={[{ value: "none", label: "Select manager…" }, ...managers.map((m) => ({ value: m.id, label: m.name }))]}
                />
              </FormField>
            )}
            <button onClick={handleCreate} disabled={saving} className="btn-primary w-full" style={{ justifyContent: "center", marginTop: "8px" }}>
              {saving ? "Creating…" : "Create user"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
