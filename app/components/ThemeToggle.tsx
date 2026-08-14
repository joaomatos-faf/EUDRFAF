"use client";

import React from "react";
import { useTheme } from "@/app/hooks/useTheme";

interface ThemeToggleProps {
  style?: React.CSSProperties;
  showText?: boolean;
}

export function ThemeToggle({ style, showText = true }: ThemeToggleProps) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      type="button"
      title={isDark ? "Alternar para Modo Claro" : "Alternar para Modo Escuro"}
      aria-label={isDark ? "Alternar para Modo Claro" : "Alternar para Modo Escuro"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: showText ? "7px 13px" : "7px 9px",
        borderRadius: "999px",
        fontSize: "12px",
        fontWeight: 750,
        cursor: "pointer",
        transition: "all 0.2s ease",
        border: isDark
          ? "1px solid rgba(209, 160, 104, 0.35)"
          : "1px solid rgba(189, 40, 32, 0.35)",
        background: isDark
          ? "linear-gradient(135deg, rgba(209, 160, 104, 0.15), rgba(189, 40, 32, 0.12))"
          : "linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(250, 238, 231, 0.95))",
        color: isDark ? "#dfa84a" : "#bd2820",
        boxShadow: isDark
          ? "0 2px 8px rgba(0, 0, 0, 0.3)"
          : "0 2px 8px rgba(189, 40, 32, 0.12)",
        ...style,
      }}
    >
      <span style={{ fontSize: "14px", lineHeight: 1 }}>
        {isDark ? "☀️" : "🌙"}
      </span>
      {showText && (
        <span>{isDark ? "Modo Claro" : "Modo Escuro"}</span>
      )}
    </button>
  );
}
