"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { Role } from "@prisma/client";
import { signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import {
  Home, Target, CheckSquare, Users, RefreshCw, BarChart3,
  FileText, Search, AlertTriangle, TrendingUp, Plus,
  ChevronLeft, ChevronRight, LogOut, ChevronUp, ChevronDown,
  User, Settings, HelpCircle, Moon, Share2,
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";

interface NavItem { href: string; label: string; icon: React.ElementType; badge?: number; dot?: boolean; children?: NavItem[]; }

const QUARTERS = ["Q1", "Q2", "Q3", "Q4"] as const;

const navByRole: Record<Role, NavItem[]> = {
  EMPLOYEE: [
    { href: "/employee", label: "Home", icon: Home },
    { href: "/employee/goals", label: "My Goals", icon: Target },
    { href: "/employee/check-ins", label: "Check-ins", icon: CheckSquare, children: QUARTERS.map((q) => ({ href: `/employee/check-ins/${q}`, label: q, icon: CheckSquare })) },
  ],
  MANAGER: [
    { href: "/manager", label: "Home", icon: Home },
    { href: "/manager/approvals", label: "Approvals", icon: CheckSquare },
    { href: "/manager/team", label: "My Team", icon: Users },
    { href: "/manager/check-ins", label: "Check-ins", icon: FileText, children: QUARTERS.map((q) => ({ href: `/manager/check-ins/${q}`, label: q, icon: FileText })) },
    { href: "/manager/shared-goals", label: "Shared Goals", icon: Share2 },
  ],
  ADMIN: [
    { href: "/admin", label: "Home", icon: Home },
    { href: "/admin/users", label: "People", icon: Users },
    { href: "/admin/cycles", label: "Cycles", icon: RefreshCw },
    { href: "/admin/analytics", label: "Analytics", icon: TrendingUp },
    { href: "/admin/reports", label: "Reports", icon: BarChart3 },
    { href: "/admin/audit", label: "Audit Log", icon: Search },
    { href: "/admin/escalations", label: "Escalations", icon: AlertTriangle },
  ],
};


const sectionLabels: Record<Role, string> = {
  EMPLOYEE: "Workspace",
  MANAGER: "Workspace",
  ADMIN: "Operations",
};

interface Props {
  role: Role;
  user: { name: string; email: string; role: string };
  collapsed: boolean;
  onToggle: () => void;
  isMobile?: boolean;
}

export function Sidebar({ role, user, collapsed, onToggle, isMobile = false }: Props) {
  const pathname = usePathname();
  const items = navByRole[role] ?? [];
  const initials = user.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const themeLabel = theme === "dark" ? "Dark" : theme === "dim" ? "Dim" : "Light";

  // Collapsible groups — auto-open when a child is active
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const item of navByRole[role] ?? []) {
      if (item.children) {
        init[item.href] = item.children.some((c) => pathname.startsWith(c.href));
      }
    }
    return init;
  });

  function toggleGroup(href: string) {
    setOpenGroups((prev) => ({ ...prev, [href]: !prev[href] }));
  }

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  return (
    <aside
      className={cn(
        "relative flex flex-col h-full transition-all duration-300 ease-[cubic-bezier(0.2,0.7,0.2,1)]",
        "border-r"
      )}
      style={{
        background: "var(--sb-bg)",
        borderColor: "var(--sb-border)",
        width: collapsed ? "72px" : "240px",
        minWidth: collapsed ? "72px" : "240px",
      }}
    >
      {/* Yellow glow top */}
      <div
        className="absolute inset-x-0 top-0 h-48 pointer-events-none rounded-[inherit]"
        style={{ background: "radial-gradient(ellipse at 30% 0%, var(--brand) / 0.10, transparent 70%)" }}
      />

      {/* Floating edge toggle — desktop only */}
      {!isMobile && <button
        onClick={onToggle}
        className="absolute top-12 -right-3.5 z-30 w-7 h-7 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-110"
        style={{
          background: "var(--brand)",
          border: "1px solid var(--brand-deep)",
          boxShadow: "var(--shadow)",
          color: "var(--brand-fg)",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.background = "var(--brand-deep)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = "var(--brand)";
        }}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed
          ? <ChevronRight className="w-3.5 h-3.5" />
          : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>}

      {/* ── Top: logo + wordmark ── */}
      <div
        className={cn(
          "flex items-center gap-2.5 px-3 py-4 border-b transition-all duration-300",
          collapsed && "justify-center px-0"
        )}
        style={{ borderColor: "var(--sb-line)" }}
      >
        <div className="relative shrink-0">
          <Image
            src="/atomberg-logo.png"
            alt="Atomberg"
            width={30}
            height={30}
            className="rounded-lg"
            style={{ boxShadow: "0 2px 8px -2px oklch(0.6 0.16 60 / 0.35)" }}
          />
        </div>
        {!collapsed && (
          <div className="overflow-hidden transition-all duration-300">
            <p className="text-[15px] font-semibold leading-tight tracking-tight" style={{ color: "var(--sb-fg-active)" }}>
              AtomQuest
            </p>
            <p className="text-[10px] uppercase tracking-[0.1em] leading-tight" style={{ color: "var(--sb-fg)", fontFamily: "var(--font-jetbrains-mono)" }}>
              {role === "ADMIN" ? "Administrator" : role === "MANAGER" ? "Manager L1" : "Employee"}
            </p>
          </div>
        )}
      </div>

      {/* ── New goal CTA — employees only ── */}
      {role === "EMPLOYEE" && (
        <div className={cn("px-3 pt-3", collapsed && "flex justify-center px-0 pt-3")}>
          <Link
            href="/employee/goals/new"
            title={collapsed ? "New Goal Sheet" : undefined}
            className={cn(
              "flex items-center gap-2.5 rounded-[10px] font-medium transition-all duration-200",
              "hover:-translate-y-px",
              collapsed ? "w-11 h-11 justify-center" : "px-3 py-2.5 w-full"
            )}
            style={{
              background: "linear-gradient(180deg, var(--brand) 0%, var(--brand-deep) 100%)",
              color: "var(--brand-fg)",
              fontSize: "13.5px",
              boxShadow: "0 1px 0 oklch(0.95 0.10 92), 0 6px 14px -6px var(--brand-deep) / 0.5, inset 0 -1px 0 oklch(0.65 0.16 65 / 0.35)",
            }}
          >
            <Plus className="w-4 h-4 shrink-0" />
            {!collapsed && <span>New Goal Sheet</span>}
          </Link>
        </div>
      )}

      {/* ── Nav ── */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {!collapsed && (
          <p className="px-2 pb-1.5 pt-1 text-[10px] uppercase tracking-[0.12em] font-semibold"
            style={{ color: "var(--sb-fg)", fontFamily: "var(--font-jetbrains-mono)" }}>
            {sectionLabels[role]}
          </p>
        )}
        {items.map((item) => {
          const Icon = item.icon;
          const homeRoutes = ["/employee", "/manager", "/admin"];
          const groupActive = item.children
            ? item.children.some((c) => pathname.startsWith(c.href))
            : homeRoutes.includes(item.href) ? pathname === item.href : pathname.startsWith(item.href);
          const active = !item.children && (homeRoutes.includes(item.href) ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + "/"));
          const isGroupOpen = item.children ? (openGroups[item.href] ?? false) : false;

          return (
            <div key={item.href}>
              <div
                className={cn(
                  "relative flex items-center rounded-[9px] text-[13.5px] transition-all duration-150 select-none",
                  collapsed ? "justify-center w-11 h-11 mx-auto" : "w-full"
                )}
                style={{
                  color: (active || groupActive) ? "var(--sb-fg-active)" : "var(--sb-fg)",
                  background: (active || groupActive) ? "oklch(0.83 0.175 88 / 0.13)" : "transparent",
                }}
              >
                {(active || groupActive) && !collapsed && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full" style={{ background: "var(--brand)" }} />
                )}
                <Link
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  onClick={() => { if (isMobile) onToggle(); }}
                  className={cn(
                    "flex items-center flex-1 min-w-0",
                    collapsed ? "justify-center w-11 h-11" : "gap-2.5 px-2.5 py-2"
                  )}
                  onMouseEnter={(e) => {
                    const parent = (e.currentTarget as HTMLElement).parentElement!;
                    if (!active && !groupActive) parent.style.background = "var(--sb-bg-hover)";
                  }}
                  onMouseLeave={(e) => {
                    const parent = (e.currentTarget as HTMLElement).parentElement!;
                    if (!active && !groupActive) parent.style.background = "transparent";
                  }}
                >
                  <Icon className="w-[18px] h-[18px] shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.dot && <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "var(--brand)" }} />}
                      {item.badge && (
                        <span className="text-[11px] px-1.5 py-0.5 rounded-full"
                          style={{ background: "oklch(0.3 0.012 75)", color: "oklch(0.78 0.02 80)", fontFamily: "var(--font-jetbrains-mono)" }}>
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </Link>
                {!collapsed && item.children && (
                  <button
                    onClick={() => toggleGroup(item.href)}
                    className="flex items-center justify-center shrink-0 rounded-[6px] transition-colors duration-150"
                    style={{ width: 26, height: 26, marginRight: 6, color: "var(--sb-fg)", background: "transparent" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--sb-bg-hover)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                  >
                    {isGroupOpen
                      ? <ChevronDown className="w-3.5 h-3.5" />
                      : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
              {!collapsed && item.children && isGroupOpen && (
                <div className="ml-7 mt-0.5 mb-0.5 space-y-0.5">
                  {item.children.map((child) => {
                    const childActive = pathname === child.href;
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={() => { if (isMobile) onToggle(); }}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-[7px] text-[12.5px] transition-all duration-150 select-none font-mono"
                        style={{
                          color: childActive ? "var(--sb-fg-active)" : "var(--sb-fg)",
                          background: childActive ? "oklch(0.83 0.175 88 / 0.10)" : "transparent",
                        }}
                        onMouseEnter={(e) => {
                          if (!childActive) (e.currentTarget as HTMLElement).style.background = "var(--sb-bg-hover)";
                        }}
                        onMouseLeave={(e) => {
                          if (!childActive) (e.currentTarget as HTMLElement).style.background = "transparent";
                        }}
                      >
                        {child.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* ── Footer: trigger + popover ── */}
      <div ref={menuRef} className="relative" style={{ borderTop: "1px solid var(--sb-line)", padding: "8px 8px 8px" }}>

        {/* Popover — opens above the trigger */}
        {menuOpen && (
          <div
            className="absolute z-50"
            style={{
              bottom: "calc(100% + 6px)",
              left: collapsed ? "calc(100% + 8px)" : "8px",
              right: collapsed ? "auto" : "8px",
              width: collapsed ? "240px" : undefined,
              background: "oklch(0.18 0.018 72)",
              border: "1px solid oklch(0.28 0.012 75)",
              borderRadius: "14px",
              boxShadow: "0 -4px 32px -4px oklch(0.08 0.012 72 / 0.7), 0 0 0 1px oklch(0.28 0.012 75)",
              overflow: "hidden",
            }}
          >
            {/* Avatar + name/email header */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 16px 13px", borderBottom: "1px solid oklch(0.26 0.012 75)" }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                style={{ background: "var(--brand)", color: "var(--brand-fg)" }}>
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-[14px] font-semibold truncate" style={{ color: "var(--sb-fg-active)" }}>{user.name}</p>
                <p className="text-[11.5px] truncate font-mono" style={{ color: "oklch(0.52 0.018 80)" }}>{user.email}</p>
              </div>
            </div>

            {/* Menu items */}
            {[
              { icon: User,        label: "Profile",           href: "/settings?tab=profile" },
              { icon: Settings,    label: "Settings",          href: "/settings" },
              { icon: HelpCircle,  label: "Help & shortcuts",  href: "/help" },
            ].map(({ icon: Icon, label, href }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                style={{ display: "flex", alignItems: "center", gap: "12px", padding: "11px 16px", color: "oklch(0.78 0.018 80)", fontSize: "14px", textDecoration: "none", transition: "background 0.12s" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "oklch(0.24 0.018 75)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                <Icon className="w-4 h-4 shrink-0" style={{ color: "oklch(0.58 0.018 80)" }} />
                {label}
              </Link>
            ))}

            {/* Theme row */}
            <Link
              href="/settings?tab=theme"
              onClick={() => setMenuOpen(false)}
              style={{ display: "flex", alignItems: "center", gap: "12px", padding: "11px 16px", color: "oklch(0.78 0.018 80)", fontSize: "14px", textDecoration: "none", transition: "background 0.12s", borderBottom: "1px solid oklch(0.26 0.012 75)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "oklch(0.24 0.018 75)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              <Moon className="w-4 h-4 shrink-0" style={{ color: "oklch(0.58 0.018 80)" }} />
              <span style={{ flex: 1 }}>Theme</span>
              <span style={{ fontSize: "13px", color: "oklch(0.52 0.018 80)" }}>{themeLabel}</span>
            </Link>

            {/* Sign out */}
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              style={{ display: "flex", alignItems: "center", gap: "12px", width: "100%", padding: "11px 16px", color: "oklch(0.72 0.14 32)", fontSize: "14px", background: "none", border: "none", cursor: "pointer", transition: "background 0.12s", textAlign: "left" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "oklch(0.22 0.05 30)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              <LogOut className="w-4 h-4 shrink-0" />
              Sign out
            </button>
          </div>
        )}

        {/* Trigger button */}
        <button
          onClick={() => setMenuOpen((v) => !v)}
          title={collapsed ? user.name : undefined}
          className={cn(
            "flex items-center gap-2.5 rounded-[10px] w-full transition-colors duration-150",
            collapsed ? "justify-center w-11 h-11 mx-auto p-0" : "px-2.5 py-2.5"
          )}
          style={{ background: menuOpen ? "var(--sb-bg-hover)" : "transparent", color: "var(--sb-fg)" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--sb-bg-hover)"; }}
          onMouseLeave={(e) => { if (!menuOpen) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
        >
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
            style={{ background: "var(--brand)", color: "var(--brand-fg)" }}>
            {initials}
          </div>
          {!collapsed && (
            <>
              <div className="flex-1 text-left min-w-0">
                <p className="text-[13px] font-medium truncate" style={{ color: "var(--sb-fg-active)" }}>{user.name}</p>
                <p className="text-[10px] truncate font-mono" style={{ color: "oklch(0.48 0.018 80)" }}>
                  {role} · {user.email.split("@")[0]}
                </p>
              </div>
              <ChevronUp
                className="w-3.5 h-3.5 shrink-0 transition-transform duration-200"
                style={{ color: "oklch(0.45 0.018 80)", transform: menuOpen ? "rotate(0deg)" : "rotate(180deg)" }}
              />
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
