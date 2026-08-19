"use client";

import { useEffect, useState, useCallback } from "react";
import { Locale, translations } from "../lib/i18n";

const LOCALE_CHANGE_EVENT = "faf_eudr_locale_change";
const STORAGE_KEY = "faf_eudr_locale";

export function useTranslation() {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(STORAGE_KEY) as Locale;
        if (saved === "pt" || saved === "en") return saved;
      } catch {}
    }
    return "pt";
  });

  useEffect(() => {
    // Sincroniza estado inicial do localStorage
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Locale;
      if ((saved === "pt" || saved === "en") && saved !== locale) {
        setLocaleState(saved);
      }
    } catch {}

    // Escuta evento customizado de troca de idioma disparado por qualquer componente
    const handleLocaleChange = (event: CustomEvent<Locale>) => {
      if (event.detail && (event.detail === "pt" || event.detail === "en")) {
        setLocaleState(event.detail);
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
