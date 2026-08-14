"use client";

import React from "react";
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

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-canvas)",
        color: "var(--text-primary)",
        display: "flex",
        flexDirection: "column",
        transition: "background-color 0.25s ease, color 0.25s ease",
      }}
    >
      {/* Top Architectural Header */}
      <header
        style={{
          borderBottom: "1px solid var(--border-hairline)",
          background: "var(--bg-header)",
          backdropFilter: "blur(12px)",
          position: "sticky",
          top: 0,
          zIndex: 40,
        }}
      >
        <div
          style={{
            maxWidth: "1400px",
            margin: "0 auto",
            padding: "16px 32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <img
              src="/faf-logo-transparent.png"
              alt="FAF Coffees"
              style={{
                height: "44px",
                width: "auto",
                objectFit: "contain",
                display: "block",
              }}
            />
            <div
              style={{
                height: "28px",
                width: "1px",
                background: "var(--border-hairline)",
              }}
            />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 800,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--brand-ochre)",
                }}
              >
                Fazenda Ambiental Fortaleza
              </span>
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: 650,
                  color: "var(--text-secondary)",
                }}
              >
                Regulamento Europeu de Desmatamento (UE 2023/1115)
              </span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <ThemeToggle />

            {onOpenDashboard && (
              <button
                onClick={onOpenDashboard}
                style={{
                  fontSize: "12.5px",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-strong)",
                  padding: "7px 14px",
                  borderRadius: "6px",
                  boxShadow: "var(--shadow-subtle)",
                  transition: "all 0.15s ease",
                }}
              >
                📊 Dashboard Executivo
              </button>
            )}

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "11.5px",
                fontWeight: 650,
                color: "var(--status-success)",
                background: "var(--status-success-bg)",
                padding: "6px 12px",
                borderRadius: "6px",
                border: "1px solid rgba(27, 122, 67, 0.2)",
              }}
            >
              <span>●</span> Sistema Ativo · WGS84
            </div>
          </div>
        </div>
      </header>

      {/* Main Editorial Body */}
      <main
        style={{
          flex: 1,
          maxWidth: "1400px",
          width: "100%",
          margin: "0 auto",
          padding: "48px 32px 80px",
          display: "flex",
          flexDirection: "column",
          gap: "48px",
        }}
      >
        {/* Editorial Split Hero */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "1.1fr 0.9fr",
            gap: "56px",
            alignItems: "start",
          }}
        >
          {/* Left Column: Brand & Regulatory Statement */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 800,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "var(--brand-crimson)",
                }}
              >
                Rastreabilidade de Origem & Diligência Prévia
              </span>
              <h1
                style={{
                  fontSize: "36px",
                  lineHeight: "1.2",
                  fontWeight: 800,
                  letterSpacing: "-0.03em",
                  color: "var(--text-primary)",
                  margin: 0,
                }}
              >
                Auditoria geoespacial e conformidade de cafés especiais para a União Europeia.
              </h1>
              <p
                style={{
                  fontSize: "15px",
                  lineHeight: "1.65",
                  color: "var(--text-secondary)",
                  margin: "8px 0 0",
                  maxWidth: "580px",
                }}
              >
                A FAF Coffees conecta cafeicultores brasileiros regenerativos e importadores globais por meio de polígonos auditados, monitoramento temporal de satélite pós-2020 e emissão de declarações de conformidade EUDR.
              </p>
            </div>

            {/* Structured Specifications Strip */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "16px",
                padding: "20px 24px",
                borderRadius: "10px",
                border: "1px solid var(--border-hairline)",
                background: "var(--bg-surface)",
                boxShadow: "var(--shadow-subtle)",
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 800,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "var(--text-muted)",
                    display: "block",
                  }}
                >
                  Marco Temporal
                </span>
                <strong
                  style={{
                    fontSize: "14px",
                    fontWeight: 750,
                    color: "var(--text-primary)",
                    marginTop: "2px",
                    display: "block",
                  }}
                >
                  31 / 12 / 2020
                </strong>
                <span style={{ fontSize: "11px", color: "var(--status-success)" }}>
                  Zero Desmatamento
                </span>
              </div>

              <div>
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 800,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "var(--text-muted)",
                    display: "block",
                  }}
                >
                  Padrão Geodésico
                </span>
                <strong
                  style={{
                    fontSize: "14px",
                    fontWeight: 750,
                    color: "var(--text-primary)",
                    marginTop: "2px",
                    display: "block",
                  }}
                >
                  WGS84 Submétrico
                </strong>
                <span style={{ fontSize: "11px", color: "var(--brand-ochre)" }}>
                  GeoJSON + Shapefile
                </span>
              </div>

              <div>
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 800,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "var(--text-muted)",
                    display: "block",
                  }}
                >
                  Armazenamento
                </span>
                <strong
                  style={{
                    fontSize: "14px",
                    fontWeight: 750,
                    color: "var(--text-primary)",
                    marginTop: "2px",
                    display: "block",
                  }}
                >
                  Cloudflare R2
                </strong>
                <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                  Nuvem Certificada
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Portal Directory Index (Architectural Cards) */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Dossier Item 01: EUDR Preparer & Agronomy */}
            <div
              style={{
                border: "1px solid var(--border-hairline)",
                borderRadius: "12px",
                padding: "24px 26px",
                background: "var(--bg-surface)",
                boxShadow: "var(--shadow-subtle)",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
                transition: "border-color 0.2s ease, box-shadow 0.2s ease",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 800,
                    letterSpacing: "0.1em",
                    color: "var(--brand-crimson)",
                    textTransform: "uppercase",
                  }}
                >
                  Módulo 01 · Agronomia & Operações
                </span>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "var(--text-muted)",
                  }}
                >
                  app.fafeu.online
                </span>
              </div>

              <div>
                <h2
                  style={{
                    fontSize: "18px",
                    fontWeight: 750,
                    color: "var(--text-primary)",
                    margin: "0 0 6px",
                    letterSpacing: "-0.01em",
                  }}
                >
                  Preparador de Dossiê EUDR
                </h2>
                <p
                  style={{
                    fontSize: "13px",
                    color: "var(--text-secondary)",
                    margin: 0,
                    lineHeight: "1.55",
                  }}
                >
                  Importação de coordenadas, simplificação geométrica, conferência temporal MapBiomas e geração dos pacotes oficiais para submissão.
                </p>
              </div>

              <div style={{ paddingTop: "8px" }}>
                <a
                  href="https://app.fafeu.online"
                  onClick={(e) => {
                    if (
                      typeof window !== "undefined" &&
                      (window.location.hostname === "localhost" ||
                        window.location.hostname === "127.0.0.1")
                    ) {
                      e.preventDefault();
                      onOpenFafApp?.();
                    }
                  }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width: "100%",
                    padding: "12px 18px",
                    borderRadius: "8px",
                    background: "var(--brand-crimson)",
                    color: "#ffffff",
                    fontSize: "13px",
                    fontWeight: 750,
                    boxShadow: "0 2px 6px rgba(166, 38, 29, 0.2)",
                    transition: "background-color 0.15s ease",
                  }}
                >
                  <span>Acessar Preparador de Talhões</span>
                  <span style={{ fontSize: "16px" }}>➔</span>
                </a>
              </div>
            </div>

            {/* Dossier Item 02: Client Portal */}
            <div
              style={{
                border: "1px solid var(--border-hairline)",
                borderRadius: "12px",
                padding: "24px 26px",
                background: "var(--bg-surface)",
                boxShadow: "var(--shadow-subtle)",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
                transition: "border-color 0.2s ease, box-shadow 0.2s ease",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 800,
                    letterSpacing: "0.1em",
                    color: "var(--brand-ochre)",
                    textTransform: "uppercase",
                  }}
                >
                  Módulo 02 · Importadores & Torrefadores
                </span>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "var(--text-muted)",
                  }}
                >
                  portal.fafeu.online
                </span>
              </div>

              <div>
                <h2
                  style={{
                    fontSize: "18px",
                    fontWeight: 750,
                    color: "var(--text-primary)",
                    margin: "0 0 6px",
                    letterSpacing: "-0.01em",
                  }}
                >
                  Portal do Cliente & Lotes
                </h2>
                <p
                  style={{
                    fontSize: "13px",
                    color: "var(--text-secondary)",
                    margin: 0,
                    lineHeight: "1.55",
                  }}
                >
                  Acesso aos lotes vinculados ao contrato de compra, com download direto de arquivos GeoJSON e relatórios auditados prontos para desembaraço.
                </p>
              </div>

              <div style={{ paddingTop: "8px" }}>
                <a
                  href="https://portal.fafeu.online"
                  onClick={(e) => {
                    if (
                      typeof window !== "undefined" &&
                      (window.location.hostname === "localhost" ||
                        window.location.hostname === "127.0.0.1")
                    ) {
                      e.preventDefault();
                      onOpenClientPortal?.();
                    }
                  }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width: "100%",
                    padding: "12px 18px",
                    borderRadius: "8px",
                    background: "var(--bg-surface)",
                    color: "var(--text-primary)",
                    border: "1px solid var(--border-strong)",
                    fontSize: "13px",
                    fontWeight: 750,
                    boxShadow: "var(--shadow-subtle)",
                    transition: "all 0.15s ease",
                  }}
                >
                  <span>Acessar Portal do Importador</span>
                  <span style={{ fontSize: "16px" }}>➔</span>
                </a>
              </div>
            </div>

            {/* Dossier Item 03: Cloud Storage Explorer */}
            <div
              style={{
                border: "1px solid var(--border-hairline)",
                borderRadius: "12px",
                padding: "24px 26px",
                background: "var(--bg-surface)",
                boxShadow: "var(--shadow-subtle)",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
                transition: "border-color 0.2s ease, box-shadow 0.2s ease",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 800,
                    letterSpacing: "0.1em",
                    color: "var(--text-secondary)",
                    textTransform: "uppercase",
                  }}
                >
                  Módulo 03 · Repositório Central R2
                </span>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "var(--text-muted)",
                  }}
                >
                  cloud.fafeu.online
                </span>
              </div>

              <div>
                <h2
                  style={{
                    fontSize: "18px",
                    fontWeight: 750,
                    color: "var(--text-primary)",
                    margin: "0 0 6px",
                    letterSpacing: "-0.01em",
                  }}
                >
                  FAF Cloud Storage
                </h2>
                <p
                  style={{
                    fontSize: "13px",
                    color: "var(--text-secondary)",
                    margin: 0,
                    lineHeight: "1.55",
                  }}
                >
                  Explorador de arquivos na nuvem com navegação por pastas regionais, visualização de metadados e backup seguro de talhões.
                </p>
              </div>

              <div style={{ paddingTop: "8px" }}>
                <a
                  href="https://cloud.fafeu.online"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width: "100%",
                    padding: "12px 18px",
                    borderRadius: "8px",
                    background: "var(--bg-subtle)",
                    color: "var(--text-primary)",
                    border: "1px solid var(--border-hairline)",
                    fontSize: "13px",
                    fontWeight: 750,
                    transition: "all 0.15s ease",
                  }}
                >
                  <span>Abrir Cloud Explorer</span>
                  <span style={{ fontSize: "16px" }}>➔</span>
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Institutional Footer */}
      <footer
        style={{
          borderTop: "1px solid var(--border-hairline)",
          background: "var(--bg-surface)",
          padding: "24px 32px",
        }}
      >
        <div
          style={{
            maxWidth: "1400px",
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
            fontSize: "12px",
            color: "var(--text-muted)",
          }}
        >
          <span>
            © {new Date().getFullYear()} FAF Coffees · Fazenda Ambiental Fortaleza. Todos os direitos reservados.
          </span>
          <span style={{ fontWeight: 650, color: "var(--text-secondary)" }}>
            Conformidade Técnica EUDR · Regulation (EU) 2023/1115
          </span>
        </div>
      </footer>
    </div>
  );
}
