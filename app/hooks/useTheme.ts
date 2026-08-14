"use client";

import { useState, useEffect, useCallback } from "react";

export type FafTheme = "dark" | "light";

export function useTheme() {
  const [theme, setThemeState] = useState<FafTheme>("dark");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("faf_eudr_theme") as FafTheme | null;
      if (saved === "light" || saved === "dark") {
        setThemeState(saved);
        document.documentElement.setAttribute("data-theme", saved);
      } else {
        document.documentElement.setAttribute("data-theme", "dark");
      }
    } catch {}

    const handleThemeChange = () => {
      try {
        const saved = localStorage.getItem("faf_eudr_theme") as FafTheme | null;
        if (saved === "light" || saved === "dark") {
          setThemeState(saved);
          document.documentElement.setAttribute("data-theme", saved);
        }
      } catch {}
    };

    window.addEventListener("faf-theme-changed", handleThemeChange);
    window.addEventListener("storage", handleThemeChange);
    return () => {
      window.removeEventListener("faf-theme-changed", handleThemeChange);
      window.removeEventListener("storage", handleThemeChange);
    };
  }, []);

  const setTheme = useCallback((newTheme: FafTheme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem("faf_eudr_theme", newTheme);
      document.documentElement.setAttribute("data-theme", newTheme);
      window.dispatchEvent(new Event("faf-theme-changed"));
    } catch {}
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  return { theme, isDark: theme === "dark", toggleTheme, setTheme };
}
