"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import type { Role } from "@prisma/client";
import { Menu, X } from "lucide-react";

interface Props {
  user: { name: string; email: string; role: Role; provider?: string };
  children: React.ReactNode;
}

export function AppShell({ user, children }: Props) {
  // null = not yet hydrated; avoids flash of wrong collapsed state on refresh
  const [collapsed, setCollapsed] = useState<boolean | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved !== null) {
      setCollapsed(saved === "true");
    } else {
      setCollapsed(window.innerWidth < 1100);
    }
  }, []);

  useEffect(() => {
    function onResize() {
      if (window.innerWidth < 760) setCollapsed(false);
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  function handleToggle() {
    const next = !(collapsed ?? false);
    setCollapsed(next);
    localStorage.setItem("sidebar-collapsed", String(next));
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg)" }}>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 fade-in md:hidden"
          style={{ background: "oklch(0.12 0.018 72 / 0.6)", backdropFilter: "blur(4px)" }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-[cubic-bezier(0.2,0.7,0.2,1)] md:hidden`}
        style={{ transform: mobileOpen ? "translateX(0)" : "translateX(-100%)" }}
      >
        <Sidebar role={user.role} user={user} collapsed={false} onToggle={() => setMobileOpen(false)} isMobile={true} />
      </div>

      {/* Desktop sidebar — don't render until collapsed state is hydrated */}
      {collapsed !== null && (
        <div className="hidden md:flex h-full shrink-0">
          <Sidebar role={user.role} user={user} collapsed={collapsed} onToggle={handleToggle} />
        </div>
      )}

      {/* Main */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Mobile topbar */}
        <div
          className="flex items-center gap-3 px-4 h-14 shrink-0 md:hidden"
          style={{ background: "var(--paper)", borderBottom: "1px solid var(--line)" }}
        >
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg"
            style={{ color: "var(--ink-soft)" }}
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-sm font-semibold" style={{ color: "var(--ink)" }}>AtomQuest</span>
        </div>

        <div className="hidden md:block">
          <Header user={user} />
        </div>

        <main
          className="flex-1 overflow-y-auto fade-up"
          style={{ padding: "28px 36px 80px" }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
