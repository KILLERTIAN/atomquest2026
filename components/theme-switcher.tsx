"use client";

import { useTheme } from "@/components/theme-provider";
import { Sun, Moon, Sunset } from "lucide-react";

const THEMES = [
  { id: "light", label: "Light",  Icon: Sun },
  { id: "dark",  label: "Dark",   Icon: Moon },
  { id: "dim",   label: "Dim",    Icon: Sunset },
] as const;

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="px-2 py-1.5">
      <p className="text-[10px] uppercase tracking-[0.12em] mb-1.5 px-1"
         style={{ color: "oklch(0.52 0.018 80)", fontFamily: "var(--font-jetbrains-mono)" }}>
        Appearance
      </p>
      <div className="flex gap-1">
        {THEMES.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setTheme(id)}
            className="flex-1 flex flex-col items-center gap-1 py-2 rounded-lg text-[11px] font-medium transition-all duration-150"
            style={{
              background: theme === id ? "var(--brand)" : "oklch(0.3 0.012 75)",
              color: theme === id ? "var(--brand-fg)" : "oklch(0.72 0.018 80)",
            }}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
