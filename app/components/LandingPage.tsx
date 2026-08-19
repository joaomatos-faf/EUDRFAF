"use client";

import React, { useState } from "react";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageToggle } from "./ui/LanguageToggle";
import { useTheme } from "@/app/hooks/useTheme";
import { useTranslation, getSubdomainUrl } from "@/app/hooks/useTranslation";

interface LandingPageProps {
  onOpenFafApp: () => void;
  onOpenClientPortal: () => void;
  onOpenDashboard?: () => void;
  onOpenCloud?: () => void;
}

export function LandingPage({
  onOpenFafApp,
  onOpenClientPortal,
  onOpenDashboard,
  onOpenCloud,
}: LandingPageProps) {
  const { isDark } = useTheme();
  const { locale, t } = useTranslation();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const gateways = [
    {
      id: "01",
      tag: t("landing.g1.tag"),
      title: t("landing.g1.title"),
      desc: t("landing.g1.desc"),
      href: getSubdomainUrl("https://app.fafeu.online", locale),
      action: onOpenFafApp,
    },
    {
      id: "02",
      tag: t("landing.g2.tag"),
      title: t("landing.g2.title"),
      desc: t("landing.g2.desc"),
      href: getSubdomainUrl("https://portal.fafeu.online", locale),
      action: onOpenClientPortal,
    },
    {
      id: "03",
      tag: t("landing.g3.tag"),
      title: t("landing.g3.title"),
      desc: t("landing.g3.desc"),
      href: getSubdomainUrl("https://cloud.fafeu.online", locale),
      action: onOpenCloud || (() => { window.location.href = getSubdomainUrl("https://cloud.fafeu.online", locale); }),
    },
  ];

  const handleNavClick = (e: React.MouseEvent, action?: () => void) => {
    if (typeof window !== "undefined") {
      const host = window.location.hostname.toLowerCase();
      // If in local development (localhost / 127.0.0.1 / workers.dev), intercept and use local SPA state
      if (host === "localhost" || host === "127.0.0.1" || host.endsWith(".workers.dev")) {
        e.preventDefault();
        action?.();
      }
      // Otherwise, on production (fafeu.online or any subdomain), let the native browser navigation go to the real subdomain href!
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-canvas)",
        color: "var(--text-primary)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "32px 40px",
        boxSizing: "border-box",
        transition: "background-color 0.3s ease, color 0.3s ease",
      }}
    >
      {/* Top Floating Header */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          maxWidth: "1300px",
          margin: "0 auto",
        }}
      >
        <a
          href="https://fafeu.online"
          onClick={(e) => handleNavClick(e)}
          style={{ display: "flex", alignItems: "center", gap: "16px", textDecoration: "none", cursor: "pointer" }}
        >
          <img
            src="/faf-logo-transparent.png"
            alt="FAF Coffees"
            style={{
              height: "36px",
              width: "auto",
              objectFit: "contain",
              display: "block",
            }}
          />
          <span
            style={{
              fontSize: "12px",
              fontWeight: 800,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--brand-crimson)",
            }}
          >
            Plataforma EUDR
          </span>
        </a>

        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {onOpenDashboard && (
            <a
              href="https://dashboard.fafeu.online"
              onClick={(e) => handleNavClick(e, onOpenDashboard)}
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--text-secondary)",
                padding: "8px 14px",
                borderRadius: "999px",
                background: "var(--bg-subtle)",
                textDecoration: "none",
                transition: "all 0.2s ease",
                cursor: "pointer",
              }}
            >
              📊 Dashboard
            </a>
          )}

          <a
            href="https://app.fafeu.online"
            onClick={(e) => handleNavClick(e, onOpenFafApp)}
            style={{
              fontSize: "13px",
              fontWeight: 700,
              color: "#ffffff",
              background: "var(--brand-crimson)",
              padding: "8px 18px",
              borderRadius: "999px",
              boxShadow: "var(--shadow-button)",
              textDecoration: "none",
              cursor: "pointer",
              transition: "transform 0.15s ease",
            }}
          >
            {t("nav.accessSystem")}
          </a>

          <LanguageToggle />
          <ThemeToggle />
        </div>
      </header>

      {/* Main Interactive Typographic Gateway */}
      <main
        style={{
          width: "100%",
          maxWidth: "1300px",
          margin: "60px auto",
          display: "flex",
          flexDirection: "column",
          gap: "40px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <span
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color: "var(--text-muted)",
              letterSpacing: "0.02em",
            }}
          >
            {t("landing.tagline")}
          </span>
          <h1
            style={{
              fontSize: "clamp(36px, 4.5vw, 64px)",
              lineHeight: 1.08,
              fontWeight: 900,
              letterSpacing: "-0.035em",
              margin: 0,
              color: "var(--text-primary)",
            }}
          >
            {t("landing.heading")}
          </h1>
        </div>

        {/* Large Typographic Interactive Rows */}
        <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
          {gateways.map((item, index) => {
            const isHovered = hoveredIndex === index;
            return (
              <a
                key={item.id}
                href={item.href}
                onClick={(e) => handleNavClick(e, item.action)}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{
                  display: "grid",
                  gridTemplateColumns: "80px 1fr auto",
                  alignItems: "center",
                  gap: "32px",
                  padding: "36px 0",
                  borderTop: "1px solid var(--border-hairline)",
                  borderBottom: index === gateways.length - 1 ? "1px solid var(--border-hairline)" : "none",
                  textDecoration: "none",
                  cursor: "pointer",
                  transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                  opacity: hoveredIndex !== null && !isHovered ? 0.4 : 1,
                  transform: isHovered ? "translateX(8px)" : "translateX(0)",
                }}
              >
                {/* Index Number */}
                <span
                  style={{
                    fontSize: "20px",
                    fontWeight: 900,
                    color: isHovered ? "var(--brand-crimson)" : "var(--text-muted)",
                    transition: "color 0.2s ease",
                  }}
                >
                  {item.id}
                </span>

                {/* Content Block */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 800,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: isHovered ? "var(--brand-crimson)" : "var(--text-muted)",
                        transition: "color 0.2s ease",
                      }}
                    >
                      {item.tag}
                    </span>
                  </div>
                  <h2
                    style={{
                      fontSize: "clamp(22px, 2.5vw, 34px)",
                      fontWeight: 800,
                      letterSpacing: "-0.02em",
                      color: isHovered ? "var(--brand-crimson)" : "var(--text-primary)",
                      margin: 0,
                      transition: "color 0.2s ease",
                    }}
                  >
                    {item.title}
                  </h2>
                  <p
                    style={{
                      fontSize: "15px",
                      color: "var(--text-secondary)",
                      margin: 0,
                      maxWidth: "600px",
                      lineHeight: 1.45,
                    }}
                  >
                    {item.desc}
                  </p>
                </div>

                {/* Arrow Action Icon */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    border: isHovered ? "1.5px solid var(--brand-crimson)" : "1px solid var(--border-strong)",
                    background: isHovered ? "var(--brand-crimson)" : "transparent",
                    color: isHovered ? "#ffffff" : "var(--text-primary)",
                    fontSize: "20px",
                    transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                    transform: isHovered ? "scale(1.1) rotate(-45deg)" : "scale(1) rotate(0deg)",
                  }}
                >
                  →
                </div>
              </a>
            );
          })}
        </div>
      </main>

      {/* Clean Minimalist Bottom Strip */}
      <footer
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
          width: "100%",
          maxWidth: "1300px",
          margin: "0 auto",
          fontSize: "12.5px",
          color: "var(--text-muted)",
        }}
      >
        <span>
          © {new Date().getFullYear()} FAF Coffees · Fazenda Ambiental Fortaleza
        </span>
        <span style={{ fontWeight: 600 }}>
          Regulamento Europeu de Desmatamento (UE 2023/1115) · Padrão WGS84
        </span>
      </footer>
    </div>
  );
}
