"use client";

import React from "react";
import { useTheme } from "@/app/hooks/useTheme";

interface ThemeToggleProps {
  style?: React.CSSProperties;
  showText?: boolean;
}

export function ThemeToggle({ style }: ThemeToggleProps) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      type="button"
      title={isDark ? "Mudar para modo claro" : "Mudar para modo escuro"}
      aria-label={isDark ? "Mudar para modo claro" : "Mudar para modo escuro"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "36px",
        height: "36px",
        borderRadius: "50%",
        cursor: "pointer",
        transition: "all 0.2s ease",
        border: "none",
        background: "transparent",
        color: "var(--text-secondary)",
        fontSize: "15px",
        ...style,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "var(--bg-subtle)";
        e.currentTarget.style.color = "var(--text-primary)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.color = "var(--text-secondary)";
      }}
    >
      {isDark ? "☀️" : "🌙"}
    </button>
  );
}
