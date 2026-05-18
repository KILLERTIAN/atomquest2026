"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "dim";

const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (t: Theme) => void;
}>({ theme: "light", setTheme: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    const stored = localStorage.getItem("aq-theme") as Theme | null;
    if (stored) applyTheme(stored);
  }, []);

  function applyTheme(t: Theme) {
    setThemeState(t);
    document.documentElement.setAttribute("data-theme", t);
    localStorage.setItem("aq-theme", t);
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme: applyTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
