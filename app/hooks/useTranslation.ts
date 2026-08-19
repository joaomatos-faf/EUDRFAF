"use client";

import { useEffect, useState, useCallback } from "react";
import { Locale, translations } from "../lib/i18n";

const LOCALE_CHANGE_EVENT = "faf_eudr_locale_change";
const STORAGE_KEY = "faf_eudr_locale";
const COOKIE_NAME = "faf_eudr_locale";

/**
 * Salva cookie com escopo compartilhado para todos os subdomínios (*.fafeu.online)
 */
function setSharedLocaleCookie(locale: Locale) {
  if (typeof document === "undefined") return;
  const host = window.location.hostname;
  let domainAttr = "";
  if (host.endsWith("fafeu.online")) {
    domainAttr = "; domain=.fafeu.online";
  }
  document.cookie = `${COOKIE_NAME}=${locale}; path=/${domainAttr}; max-age=31536000; SameSite=Lax`;
}

/**
 * Lê o cookie de idioma
 */
function getSharedLocaleCookie(): Locale | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(?:^|; )" + COOKIE_NAME + "=([^;]*)"));
  if (match && (match[1] === "pt" || match[1] === "en")) {
    return match[1] as Locale;
  }
  return null;
}

/**
 * Detecta o idioma a partir da URL (/en, /pt, ou ?lang=...)
 */
function detectLocaleFromUrl(): Locale | null {
  if (typeof window === "undefined") return null;
  const pathname = window.location.pathname.toLowerCase();
  if (pathname === "/en" || pathname.startsWith("/en/")) return "en";
  if (pathname === "/pt" || pathname.startsWith("/pt/")) return "pt";

  const searchParams = new URLSearchParams(window.location.search);
  const langParam = searchParams.get("lang")?.toLowerCase();
  if (langParam === "en" || langParam === "pt") return langParam as Locale;

  return null;
}

/**
 * Atualiza o pathname da URL no navegador para refletir o idioma (/en ou /)
 */
function syncUrlWithLocale(newLocale: Locale) {
  if (typeof window === "undefined") return;
  const currentPath = window.location.pathname;
  const currentSearch = window.location.search;
  const currentHash = window.location.hash;

  let cleanPath = currentPath;
  if (cleanPath === "/en" || cleanPath === "/pt") {
    cleanPath = "/";
  } else if (cleanPath.startsWith("/en/")) {
    cleanPath = cleanPath.slice(3);
  } else if (cleanPath.startsWith("/pt/")) {
    cleanPath = cleanPath.slice(3);
  }

  let targetPath = cleanPath;
  if (newLocale === "en") {
    targetPath = cleanPath === "/" ? "/en" : `/en${cleanPath}`;
  }

  if (currentPath !== targetPath) {
    const fullUrl = `${targetPath}${currentSearch}${currentHash}`;
    window.history.replaceState(null, "", fullUrl);
  }
}

export function useTranslation() {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window !== "undefined") {
      // 1. Prioridade para a URL (/en)
      const urlLocale = detectLocaleFromUrl();
      if (urlLocale) return urlLocale;

      // 2. Cookie compartilhado entre todos os subdomínios
      const cookieLocale = getSharedLocaleCookie();
      if (cookieLocale) return cookieLocale;

      // 3. LocalStorage
      try {
        const saved = localStorage.getItem(STORAGE_KEY) as Locale;
        if (saved === "pt" || saved === "en") return saved;
      } catch {}
    }
    return "pt";
  });

  useEffect(() => {
    // Sincroniza estado inicial e URL
    const urlLoc = detectLocaleFromUrl();
    const cookieLoc = getSharedLocaleCookie();
    const activeLoc = urlLoc || cookieLoc || locale;

    if (activeLoc !== locale) {
      setLocaleState(activeLoc);
    }
    setSharedLocaleCookie(activeLoc);
    syncUrlWithLocale(activeLoc);

    // Escuta evento customizado de troca de idioma disparado por qualquer componente
    const handleLocaleChange = (event: CustomEvent<Locale>) => {
      if (event.detail && (event.detail === "pt" || event.detail === "en")) {
        setLocaleState(event.detail);
        setSharedLocaleCookie(event.detail);
        syncUrlWithLocale(event.detail);
      }
    };

    window.addEventListener(LOCALE_CHANGE_EVENT as any, handleLocaleChange);
    return () => {
      window.removeEventListener(LOCALE_CHANGE_EVENT as any, handleLocaleChange);
    };
  }, [locale]);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem(STORAGE_KEY, newLocale);
      setSharedLocaleCookie(newLocale);
      syncUrlWithLocale(newLocale);
      window.dispatchEvent(new CustomEvent(LOCALE_CHANGE_EVENT, { detail: newLocale }));
    } catch {}
  }, []);

  const t = useCallback(
    (key: string): string => {
      return translations[locale]?.[key] || translations["pt"]?.[key] || key;
    },
    [locale]
  );

  return { locale, setLocale, t };
}

/**
 * Constrói URL com persistência de idioma para links entre subdomínios
 */
export function getSubdomainUrl(baseUrl: string, locale: Locale): string {
  const cleanBase = baseUrl.replace(/\/en\/?$/, "").replace(/\/pt\/?$/, "").replace(/\/$/, "");
  if (locale === "en") {
    return `${cleanBase}/en`;
  }
  return `${cleanBase}/`;
}
