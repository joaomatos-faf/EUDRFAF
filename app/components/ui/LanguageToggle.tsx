"use client";

import React from "react";
import { useTranslation } from "@/app/hooks/useTranslation";

export function LanguageToggle() {
  const { locale, setLocale } = useTranslation();

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        background: "var(--bg-subtle)",
        border: "1px solid var(--border-hairline)",
        borderRadius: "999px",
        padding: "2px",
        fontSize: "11px",
        fontWeight: 700,
      }}
    >
      <button
        type="button"
        onClick={() => setLocale("pt")}
        style={{
          background: locale === "pt" ? "var(--brand-crimson)" : "transparent",
          color: locale === "pt" ? "#ffffff" : "var(--text-secondary)",
          border: "none",
          borderRadius: "999px",
          padding: "4px 8px",
          cursor: "pointer",
          transition: "all 0.15s ease",
        }}
        title="Português (Brasil)"
      >
        🇧🇷 PT
      </button>
      <button
        type="button"
        onClick={() => setLocale("en")}
        style={{
          background: locale === "en" ? "var(--brand-crimson)" : "transparent",
          color: locale === "en" ? "#ffffff" : "var(--text-secondary)",
          border: "none",
          borderRadius: "999px",
          padding: "4px 8px",
          cursor: "pointer",
          transition: "all 0.15s ease",
        }}
        title="English (International)"
      >
        🇬🇧 EN
      </button>
    </div>
  );
}
