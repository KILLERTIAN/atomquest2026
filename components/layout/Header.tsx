"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, Search, Target, Users, RefreshCw, BarChart3, Home, CheckSquare, FileText, AlertTriangle, TrendingUp, ClipboardCheck, RotateCcw, Clock, TriangleAlert } from "lucide-react";

interface Props {
  user: { name: string; email: string; role: string };
  pageTitle?: string;
}

type NotifKind = "submit" | "approve" | "reminder" | "return" | "report" | "shared_goal" | "unlock" | "manager_changed" | "profile_updated";

const NOTIF_META: Record<NotifKind, { icon: React.ElementType; bg: string; color: string }> = {
  submit:          { icon: ClipboardCheck, bg: "oklch(0.94 0.08 92)",  color: "oklch(0.52 0.14 80)"  },
  approve:         { icon: CheckSquare,    bg: "oklch(0.93 0.10 142)", color: "oklch(0.46 0.16 142)" },
  reminder:        { icon: Clock,          bg: "oklch(0.93 0.05 240)", color: "oklch(0.46 0.12 240)" },
  return:          { icon: RotateCcw,      bg: "oklch(0.95 0.07 50)",  color: "oklch(0.55 0.14 50)"  },
  report:          { icon: BarChart3,      bg: "oklch(0.93 0.05 270)", color: "oklch(0.46 0.12 270)" },
  shared_goal:     { icon: Target,         bg: "oklch(0.93 0.07 65)",  color: "oklch(0.50 0.14 65)"  },
  unlock:          { icon: TriangleAlert,  bg: "oklch(0.94 0.06 50)",  color: "oklch(0.52 0.12 50)"  },
  manager_changed:  { icon: Users,          bg: "oklch(0.93 0.05 240)", color: "oklch(0.46 0.12 240)" },
  profile_updated:  { icon: Users,          bg: "oklch(0.93 0.05 270)", color: "oklch(0.46 0.12 270)" },
};

interface DbNotif {
  id: string; type: string; title: string; message: string;
  link: string | null; readAt: string | null; createdAt: string;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const CMD_ITEMS_BY_ROLE: Record<string, { label: string; href: string; icon: React.ElementType; sub: string }[]> = {
  ADMIN: [
    { label: "Dashboard",   href: "/admin",              icon: Home,         sub: "Overview & quick stats" },
    { label: "People",      href: "/admin/users",        icon: Users,        sub: "Manage users & roles" },
    { label: "Cycles",      href: "/admin/cycles",       icon: RefreshCw,    sub: "Goal cycle settings" },
    { label: "Analytics",   href: "/admin/analytics",    icon: TrendingUp,   sub: "Org performance trends" },
    { label: "Reports",     href: "/admin/reports",      icon: BarChart3,    sub: "Export & detailed reports" },
    { label: "Audit Log",   href: "/admin/audit",        icon: Search,       sub: "All system actions" },
    { label: "Escalations", href: "/admin/escalations",  icon: AlertTriangle, sub: "Flagged items" },
  ],
  MANAGER: [
    { label: "Dashboard",   href: "/manager",              icon: Home,       sub: "Team overview" },
    { label: "Approvals",   href: "/manager/approvals",    icon: CheckSquare, sub: "Review queue" },
    { label: "My Team",     href: "/manager/team",         icon: Users,      sub: "Team status board" },
    { label: "Check-ins Q1", href: "/manager/check-ins/Q1", icon: FileText,  sub: "Q1 check-in comments" },
    { label: "Check-ins Q2", href: "/manager/check-ins/Q2", icon: FileText,  sub: "Q2 check-in comments" },
    { label: "Check-ins Q3", href: "/manager/check-ins/Q3", icon: FileText,  sub: "Q3 check-in comments" },
    { label: "Check-ins Q4", href: "/manager/check-ins/Q4", icon: FileText,  sub: "Q4 check-in comments" },
  ],
  EMPLOYEE: [
    { label: "Dashboard",   href: "/employee",               icon: Home,       sub: "Your overview" },
    { label: "My Goals",    href: "/employee/goals",         icon: Target,     sub: "Goal sheets" },
    { label: "New Goal",    href: "/employee/goals/new",     icon: Target,     sub: "Create goal sheet" },
    { label: "Check-in Q1", href: "/employee/check-ins/Q1", icon: CheckSquare, sub: "Q1 achievements" },
    { label: "Check-in Q2", href: "/employee/check-ins/Q2", icon: CheckSquare, sub: "Q2 achievements" },
    { label: "Check-in Q3", href: "/employee/check-ins/Q3", icon: CheckSquare, sub: "Q3 achievements" },
    { label: "Check-in Q4", href: "/employee/check-ins/Q4", icon: CheckSquare, sub: "Q4 achievements" },
  ],
};

export function Header({ user, pageTitle }: Props) {
  const router = useRouter();
  const [cmdOpen, setCmdOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<DbNotif[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  useEffect(() => {
    fetch("/api/notifications").then((r) => r.json()).then((d) => { if (Array.isArray(d)) setNotifications(d); }).catch(() => {});
  }, []);

  useEffect(() => {
    if (notifOpen) {
      fetch("/api/notifications").then((r) => r.json()).then((d) => { if (Array.isArray(d)) setNotifications(d); }).catch(() => {});
    }
  }, [notifOpen]);
  const allItems = CMD_ITEMS_BY_ROLE[user.role] ?? CMD_ITEMS_BY_ROLE.EMPLOYEE;
  const filtered = query.trim()
    ? allItems.filter((i) => i.label.toLowerCase().includes(query.toLowerCase()) || i.sub.toLowerCase().includes(query.toLowerCase()))
    : allItems;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCmdOpen((v) => !v);
      }
      if (e.key === "Escape") setCmdOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (cmdOpen) { setTimeout(() => inputRef.current?.focus(), 50); setQuery(""); setSelectedIndex(-1); }
  }, [cmdOpen]);

  useEffect(() => { setSelectedIndex(-1); }, [query]);

  function markAllRead() {
    fetch("/api/notifications", { method: "PATCH" }).catch(() => {});
    setNotifications((n) => n.map((x) => ({ ...x, readAt: x.readAt ?? new Date().toISOString() })));
  }

  return (
    <>
      <header
        className="flex items-center justify-between px-6 shrink-0 z-10"
        style={{
          height: "60px",
          background: "var(--paper)",
          borderBottom: "1px solid var(--line)",
          boxShadow: "0 1px 0 var(--line)",
        }}
      >
        {/* Left: breadcrumb */}
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className="text-[10px] font-semibold px-2 py-1 rounded"
            style={{
              background: "var(--sb-bg)",
              color: "var(--sb-fg-active)",
              fontFamily: "var(--font-jetbrains-mono)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            {user.role}
          </span>
          {pageTitle && (
            <>
              <span style={{ color: "var(--ink-mute)", fontSize: "13px" }}>/</span>
              <span className="text-sm font-medium truncate" style={{ color: "var(--ink)" }}>{pageTitle}</span>
            </>
          )}
        </div>

        {/* Right: search trigger + notifications */}
        <div className="flex items-center gap-1.5">
          {/* ⌘K trigger */}
          <button
            onClick={() => setCmdOpen(true)}
            className="flex items-center gap-2 rounded-lg px-3 py-1.5 transition-colors"
            style={{
              background: "var(--bg-elev)",
              border: "1px solid var(--line)",
              color: "var(--ink-mute)",
              fontSize: "12.5px",
              cursor: "pointer",
              width: "160px",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--brand)"; (e.currentTarget as HTMLElement).style.color = "var(--ink)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--line)"; (e.currentTarget as HTMLElement).style.color = "var(--ink-mute)"; }}
          >
            <Search className="w-3.5 h-3.5" style={{ flexShrink: 0 }} />
            <span style={{ fontFamily: "var(--font-jetbrains-mono)", flex: 1, textAlign: "left" }}>Search…</span>
            <kbd style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: "10px", background: "var(--line)", color: "var(--ink-mute)", padding: "1px 5px", borderRadius: "4px" }}>⌘K</kbd>
          </button>

          {/* Notification bell */}
          <DropdownMenu open={notifOpen} onOpenChange={setNotifOpen}>
            <DropdownMenuTrigger
              className="relative p-2 rounded-lg transition-colors"
              style={{ color: "var(--ink-soft)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--bg-elev)"; (e.currentTarget as HTMLElement).style.color = "var(--ink)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--ink-soft)"; }}
            >
              <Bell className="w-4.5 h-4.5" />
              {unreadCount > 0 && (
                <span
                  className="absolute top-1 right-1 flex items-center justify-center rounded-full font-bold"
                  style={{ background: "oklch(0.86 0.175 88)", color: "oklch(0.18 0.018 75)", width: "15px", height: "15px", fontSize: "8px", fontFamily: "var(--font-jetbrains-mono)", lineHeight: 1 }}
                >
                  {unreadCount}
                </span>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" style={{ width: "320px", padding: "0", overflow: "hidden" }}>
              <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink-mute)", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "var(--font-jetbrains-mono)", margin: 0 }}>
                  Notifications {unreadCount > 0 && <span style={{ background: "var(--brand)", color: "var(--brand-fg)", borderRadius: "999px", padding: "1px 6px", fontSize: "9px", marginLeft: "6px" }}>{unreadCount} new</span>}
                </p>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} style={{ fontSize: "11px", color: "var(--brand-deep)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                    Mark all read
                  </button>
                )}
              </div>
              <div style={{ maxHeight: "360px", overflowY: "auto" }}>
                {notifications.length === 0 && (
                  <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--ink-mute)", fontSize: "13px" }}>No notifications yet</div>
                )}
                {notifications.map((n, i) => {
                  const kind = (NOTIF_META[n.type as NotifKind] ? n.type : "reminder") as NotifKind;
                  const meta = NOTIF_META[kind];
                  const IconComp = meta.icon;
                  const unread = !n.readAt;
                  const row = (
                    <div
                      key={n.id}
                      style={{
                        display: "flex", alignItems: "flex-start", gap: "12px",
                        padding: "12px 16px", background: "transparent",
                        borderBottom: i < notifications.length - 1 ? "1px solid var(--line)" : "none",
                        cursor: n.link ? "pointer" : "default", transition: "background 0.12s",
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--bg-elev)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                      onClick={() => {
                        if (n.link) router.push(n.link);
                        setNotifications((prev) => prev.map((x) => x.id === n.id ? { ...x, readAt: x.readAt ?? new Date().toISOString() } : x));
                      }}
                    >
                      <div style={{ width: "34px", height: "34px", borderRadius: "10px", background: meta.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <IconComp style={{ width: "15px", height: "15px", color: meta.color }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: "13px", fontWeight: unread ? 600 : 400, color: "var(--ink)", margin: "0 0 2px", lineHeight: 1.4 }}>{n.title}</p>
                        <p style={{ fontSize: "11.5px", color: "var(--ink-mute)", margin: "0 0 3px", lineHeight: 1.4 }}>{n.message}</p>
                        <p style={{ fontSize: "10.5px", color: "var(--ink-mute)", margin: 0, fontFamily: "var(--font-jetbrains-mono)" }}>{timeAgo(n.createdAt)}</p>
                      </div>
                      {unread && (
                        <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "oklch(0.86 0.175 88)", flexShrink: 0, marginTop: "5px" }} />
                      )}
                    </div>
                  );
                  return row;
                })}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* ⌘K Command Palette */}
      {cmdOpen && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "oklch(0.12 0.018 72 / 0.55)",
            backdropFilter: "blur(4px)",
            display: "flex", alignItems: "flex-start", justifyContent: "center",
            paddingTop: "15vh",
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setCmdOpen(false); }}
        >
          <div
            style={{
              width: "min(560px, 90vw)",
              background: "var(--paper)",
              borderRadius: "16px",
              border: "1px solid var(--line-strong)",
              boxShadow: "0 32px 80px -12px oklch(0.12 0.018 72 / 0.45), 0 0 0 1px var(--line)",
              overflow: "hidden",
            }}
          >
            {/* Search input */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 18px", borderBottom: "1px solid var(--line)" }}>
              <Search style={{ width: "16px", height: "16px", color: "var(--ink-mute)", flexShrink: 0 }} />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1)); }
                  else if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIndex((i) => Math.max(i - 1, 0)); }
                  else if (e.key === "Enter" && selectedIndex >= 0 && filtered[selectedIndex]) {
                    setCmdOpen(false);
                    router.push(filtered[selectedIndex].href);
                  }
                }}
                placeholder="Search pages and actions…"
                style={{
                  flex: 1, border: "none", outline: "none", background: "transparent",
                  fontSize: "15px", color: "var(--ink)", fontFamily: "inherit",
                }}
              />
              <kbd style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: "10.5px", background: "var(--bg-elev)", border: "1px solid var(--line)", color: "var(--ink-mute)", padding: "2px 7px", borderRadius: "5px" }}>esc</kbd>
            </div>

            {/* Results */}
            <div style={{ padding: "8px 0", maxHeight: "380px", overflowY: "auto" }}>
              {filtered.length === 0 && (
                <div style={{ padding: "24px", textAlign: "center", color: "var(--ink-mute)", fontSize: "13px", fontFamily: "var(--font-jetbrains-mono)" }}>
                  No results for "{query}"
                </div>
              )}
              {filtered.length > 0 && !query && (
                <p style={{ padding: "4px 18px 8px", fontSize: "10.5px", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--ink-mute)", fontFamily: "var(--font-jetbrains-mono)", fontWeight: 600 }}>
                  Navigation
                </p>
              )}
              {filtered.map((item, i) => {
                const ItemIcon = item.icon;
                const active = i === selectedIndex;
                return (
                  <a
                    key={i}
                    href={item.href}
                    onClick={() => setCmdOpen(false)}
                    onMouseEnter={() => setSelectedIndex(i)}
                    onMouseLeave={() => setSelectedIndex(-1)}
                    style={{
                      display: "flex", alignItems: "center", gap: "14px",
                      padding: "10px 18px", textDecoration: "none",
                      color: "var(--ink)", transition: "background 0.1s",
                      background: active ? "var(--bg-elev)" : "transparent",
                    }}
                  >
                    <span style={{ width: "32px", height: "32px", borderRadius: "8px", background: "var(--bg-elev)", border: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <ItemIcon style={{ width: "15px", height: "15px", color: "var(--ink-soft)" }} />
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: "13.5px", fontWeight: 500 }}>{item.label}</p>
                      <p style={{ margin: 0, fontSize: "11.5px", color: "var(--ink-mute)" }}>{item.sub}</p>
                    </div>
                    <span style={{ fontSize: "11px", color: "var(--ink-mute)", fontFamily: "var(--font-jetbrains-mono)", flexShrink: 0 }}>↵</span>
                  </a>
                );
              })}
            </div>

            {/* Footer hint */}
            <div style={{ padding: "10px 18px", borderTop: "1px solid var(--line)", display: "flex", gap: "16px" }}>
              {[["↑↓", "navigate"], ["↵", "open"], ["esc", "close"]].map(([key, label]) => (
                <span key={key} style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", color: "var(--ink-mute)", fontFamily: "var(--font-jetbrains-mono)" }}>
                  <kbd style={{ background: "var(--bg-elev)", border: "1px solid var(--line)", padding: "1px 5px", borderRadius: "4px" }}>{key}</kbd>
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
