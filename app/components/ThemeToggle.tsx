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
        padding: showText ? "6px 12px" : "6px 8px",
        borderRadius: "6px",
        fontSize: "12px",
        fontWeight: 650,
        cursor: "pointer",
        transition: "all 0.15s ease",
        border: "1px solid var(--border-strong)",
        background: "var(--bg-surface)",
        color: "var(--text-primary)",
        boxShadow: "var(--shadow-subtle)",
        ...style,
      }}
    >
      <span style={{ fontSize: "13px", lineHeight: 1 }}>
        {isDark ? "☀️" : "🌙"}
      </span>
      {showText && (
        <span style={{ letterSpacing: "0.01em" }}>
          {isDark ? "Modo Claro" : "Modo Escuro"}
        </span>
      )}
    </button>
  );
}
