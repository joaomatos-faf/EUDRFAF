"use client";

import { useEffect, useState } from "react";
import { Locale, translations } from "../lib/i18n";

export function useTranslation() {
  const [locale, setLocale] = useState<Locale>("pt");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("faf_eudr_locale") as Locale;
      if (saved === "pt" || saved === "en") {
        setLocale(saved);
      }
    } catch {}
  }, []);

  const changeLocale = (newLocale: Locale) => {
    setLocale(newLocale);
    try {
      localStorage.setItem("faf_eudr_locale", newLocale);
    } catch {}
  };

  const t = (key: string): string => {
    return translations[locale]?.[key] || translations["pt"]?.[key] || key;
  };

  return { locale, setLocale: changeLocale, t };
}
