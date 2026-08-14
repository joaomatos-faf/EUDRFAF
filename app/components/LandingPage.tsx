"use client";

import React, { useState } from "react";
import { ThemeToggle } from "./ThemeToggle";
import { useTheme } from "@/app/hooks/useTheme";

interface LandingPageProps {
  onOpenFafApp?: () => void;
  onOpenClientPortal?: () => void;
  onOpenDashboard?: () => void;
}

export function LandingPage({
  onOpenFafApp,
  onOpenClientPortal,
  onOpenDashboard,
}: LandingPageProps) {
  const { isDark } = useTheme();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const gateways = [
    {
      id: "01",
      tag: "Equipe & Agrônomos",
      title: "Preparar e Auditar Talhões",
      desc: "Mapeamento poligonal, desenho de áreas e validação temporal MapBiomas / EUDR.",
      href: "https://app.fafeu.online",
      action: onOpenFafApp,
    },
    {
      id: "02",
      tag: "Importadores & Torrefações",
      title: "Contratos e Arquivos GeoJSON",
      desc: "Consulta de lotes e download direto de pacotes auditados para desembaraço na UE.",
      href: "https://portal.fafeu.online",
      action: onOpenClientPortal,
    },
    {
      id: "03",
      tag: "Infraestrutura Cloud",
      title: "Repositório Cloudflare R2",
      desc: "Armazenamento e gestão de arquivos brutos das 13 regiões cafeeiras.",
      href: "https://cloud.fafeu.online",
      action: undefined,
    },
  ];

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
      {/* Top Floating Branding */}
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
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
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
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          {onOpenDashboard && (
            <button
              onClick={onOpenDashboard}
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--text-secondary)",
                transition: "color 0.2s ease",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
            >
              Dashboard
            </button>
          )}
          <ThemeToggle />
        </div>
      </header>

      {/* Main Interactive Typographic Gateway (No Boxes, Pure Flow) */}
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
            Fazenda Ambiental Fortaleza · Acesso Seguro
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
            Selecione seu portal de entrada.
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
                onClick={(e) => {
                  if (
                    item.action &&
                    typeof window !== "undefined" &&
                    (window.location.hostname === "localhost" ||
                      window.location.hostname === "127.0.0.1")
                  ) {
                    e.preventDefault();
                    item.action();
                  }
                }}
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
