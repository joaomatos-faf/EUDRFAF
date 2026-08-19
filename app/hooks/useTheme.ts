"use client";

import { useState, useEffect, useCallback } from "react";

export type FafTheme = "dark" | "light";

const STORAGE_KEY = "faf_eudr_theme";
const COOKIE_NAME = "faf_eudr_theme";
const THEME_CHANGE_EVENT = "faf_eudr_theme_change";

/**
 * Salva cookie de tema compartilhado para todos os subdomínios (*.fafeu.online)
 */
function setSharedThemeCookie(theme: FafTheme) {
  if (typeof document === "undefined") return;
  const host = window.location.hostname;
  let domainAttr = "";
  if (host.endsWith("fafeu.online")) {
    domainAttr = "; domain=.fafeu.online";
  }
  document.cookie = `${COOKIE_NAME}=${theme}; path=/${domainAttr}; max-age=31536000; SameSite=Lax`;
}

/**
 * Lê o cookie de tema
 */
function getSharedThemeCookie(): FafTheme | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(?:^|; )" + COOKIE_NAME + "=([^;]*)"));
  if (match && (match[1] === "light" || match[1] === "dark")) {
    return match[1] as FafTheme;
  }
  return null;
}

export function useTheme() {
  const [theme, setThemeState] = useState<FafTheme>(() => {
    if (typeof window !== "undefined") {
      // 1. Cookie compartilhado entre todos os subdomínios
      const cookieTheme = getSharedThemeCookie();
      if (cookieTheme) return cookieTheme;

      // 2. LocalStorage
      try {
        const saved = localStorage.getItem(STORAGE_KEY) as FafTheme | null;
        if (saved === "light" || saved === "dark") return saved;
      } catch {}
    }
    return "dark";
  });

  useEffect(() => {
    // Sincroniza estado inicial e atributo HTML
    const cookieTheme = getSharedThemeCookie();
    let savedLocal: FafTheme | null = null;
    try {
      savedLocal = localStorage.getItem(STORAGE_KEY) as FafTheme | null;
    } catch {}

    const activeTheme = cookieTheme || savedLocal || theme;
    if (activeTheme !== theme) {
      setThemeState(activeTheme);
    }
    document.documentElement.setAttribute("data-theme", activeTheme);
    setSharedThemeCookie(activeTheme);

    const handleThemeChange = (event?: CustomEvent<FafTheme>) => {
      const newTheme = event?.detail || getSharedThemeCookie() || (localStorage.getItem(STORAGE_KEY) as FafTheme | null);
      if (newTheme === "light" || newTheme === "dark") {
        setThemeState(newTheme);
        document.documentElement.setAttribute("data-theme", newTheme);
      }
    };

    window.addEventListener(THEME_CHANGE_EVENT as any, handleThemeChange);
    window.addEventListener("storage", handleThemeChange as any);
    return () => {
      window.removeEventListener(THEME_CHANGE_EVENT as any, handleThemeChange);
      window.removeEventListener("storage", handleThemeChange as any);
    };
  }, [theme]);

  const setTheme = useCallback((newTheme: FafTheme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(STORAGE_KEY, newTheme);
      setSharedThemeCookie(newTheme);
      document.documentElement.setAttribute("data-theme", newTheme);
      window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { detail: newTheme }));
    } catch {}
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  return { theme, isDark: theme === "dark", toggleTheme, setTheme };
}
