"use client";

import React from "react";
import { ThemeToggle } from "./ThemeToggle";
import { useTheme } from "@/app/hooks/useTheme";

interface LandingPageProps {
  onOpenFafApp?: () => void;
  onOpenClientPortal?: () => void;
  onOpenDashboard?: () => void;
}

export function LandingPage({ onOpenFafApp, onOpenClientPortal, onOpenDashboard }: LandingPageProps) {
  const { isDark } = useTheme();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: isDark
          ? "radial-gradient(ellipse at 50% 0%, #28120e 0%, #160a08 50%, #0a0403 100%)"
          : "radial-gradient(ellipse at 50% 0%, #fffbf7 0%, #f7efe6 50%, #eddcd0 100%)",
        color: isDark ? "#fcf9f5" : "#1a0f0d",
        fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        transition: "background 0.3s ease, color 0.3s ease",
      }}
    >
      <style>{`
        .landing-cards-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 24px;
          width: 100%;
          max-width: 1200px;
        }
        @media (max-width: 980px) {
          .landing-cards-grid {
            grid-template-columns: 1fr;
            max-width: 520px;
          }
        }
        .landing-card {
          transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
        }
        .landing-card:hover {
          transform: translateY(-6px);
        }
      `}</style>

      {/* Top Navbar */}
      <header
        style={{
          padding: "18px 40px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: isDark ? "1px solid rgba(209, 160, 104, 0.2)" : "1px solid rgba(209, 160, 104, 0.35)",
          background: isDark ? "rgba(18, 9, 8, 0.85)" : "rgba(255, 255, 255, 0.9)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.4)" : "0 4px 20px rgba(70,30,20,0.06)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <img
            src="/faf-logo-transparent.png"
            alt="FAF Coffees"
            style={{ height: "46px", width: "auto", objectFit: "contain", display: "block" }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <ThemeToggle />

          {onOpenDashboard && (
            <button
              onClick={onOpenDashboard}
              style={{
                fontSize: "12px",
                background: isDark ? "rgba(209, 160, 104, 0.12)" : "rgba(209, 160, 104, 0.2)",
                color: isDark ? "#dfa84a" : "#b37e33",
                border: "1px solid rgba(209, 160, 104, 0.35)",
                padding: "8px 16px",
                borderRadius: "999px",
                fontWeight: 800,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.2s ease",
              }}
            >
              <span>📊</span> Dashboard Executivo
            </button>
          )}

          <span
            style={{
              fontSize: "12px",
              background: isDark ? "rgba(189, 40, 32, 0.15)" : "rgba(189, 40, 32, 0.1)",
              color: isDark ? "#fca5a5" : "#bd2820",
              border: "1px solid rgba(189, 40, 32, 0.35)",
              padding: "7px 14px",
              borderRadius: "999px",
              fontWeight: 700,
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#10b981", boxShadow: "0 0 8px #10b981" }}></span>
            Regulation (EU) 2023/1115 (EUDR)
          </span>
        </div>
      </header>

      {/* Main Hero Content */}
      <main
        style={{
          flex: 1,
          maxWidth: "1280px",
          width: "100%",
          margin: "0 auto",
          padding: "40px 24px 70px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {/* Central Logo & Brand Typography */}
        <div style={{ textAlign: "center", marginBottom: "44px" }}>
          <img
            src="/faf-logo-transparent.png"
            alt="FAF Coffees"
            style={{
              height: "115px",
              width: "auto",
              objectFit: "contain",
              margin: "0 auto 20px",
              display: "block",
              filter: isDark
                ? "drop-shadow(0 15px 35px rgba(189, 40, 32, 0.45))"
                : "drop-shadow(0 12px 25px rgba(189, 40, 32, 0.25))",
            }}
          />

          <h1
            style={{
              fontSize: "32px",
              fontWeight: 800,
              color: isDark ? "#ffffff" : "#1a0f0d",
              margin: "0 0 10px",
              letterSpacing: "-0.5px",
            }}
          >
            Plataforma de Conformidade & Rastreabilidade EUDR
          </h1>

          <p
            style={{
              fontSize: "15px",
              color: isDark ? "#d4c4b6" : "#5c4d44",
              margin: 0,
              maxWidth: "620px",
              lineHeight: 1.55,
            }}
          >
            Diligência prévia geoespacial, polígonos certificados e gestão em nuvem para exportações de cafés especiais sustentáveis.
          </p>
        </div>

        {/* 3 Cards Grid */}
        <div className="landing-cards-grid">
          {/* Card 1: FAF Team / Preparador & Contratos */}
          <div
            className="landing-card"
            style={{
              background: isDark
                ? "linear-gradient(150deg, rgba(40, 18, 14, 0.9) 0%, rgba(22, 10, 8, 0.95) 100%)"
                : "linear-gradient(150deg, rgba(255, 255, 255, 0.98), rgba(253, 248, 242, 0.98))",
              borderRadius: "20px",
              padding: "32px 28px",
              border: isDark ? "1px solid rgba(189, 40, 32, 0.35)" : "1px solid rgba(209, 160, 104, 0.35)",
              boxShadow: isDark
                ? "0 18px 45px rgba(0, 0, 0, 0.4), 0 0 30px rgba(189, 40, 32, 0.1)"
                : "0 14px 40px rgba(70, 30, 20, 0.08)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 800,
                  color: isDark ? "#dfa84a" : "#b37e33",
                  textTransform: "uppercase",
                  letterSpacing: "1.2px",
                  marginBottom: "8px",
                }}
              >
                Equipe & Agrônomos FAF
              </div>
              <h2 style={{ fontSize: "21px", fontWeight: 700, color: isDark ? "#ffffff" : "#1a0f0d", margin: "0 0 12px" }}>
                Gestão & Preparador EUDR
              </h2>
              <p style={{ fontSize: "13.5px", color: isDark ? "#d4c4b6" : "#5c4d44", lineHeight: 1.55, margin: "0 0 28px" }}>
                Acesso interno para criação de novos contratos, desenho e simplificação de polígonos e validação no MapBiomas / GFW.
              </p>
            </div>

            <button
              type="button"
              onClick={() => onOpenFafApp?.()}
              style={{
                width: "100%",
                padding: "14px 20px",
                fontSize: "14px",
                fontWeight: 800,
                borderRadius: "12px",
                background: "linear-gradient(135deg, #bd2820 0%, #8d1b15 100%)",
                color: "#ffffff",
                border: "1px solid rgba(209, 160, 104, 0.3)",
                boxShadow: "0 8px 24px rgba(189, 40, 32, 0.35)",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              🔒 Acessar Sistema FAF ➔
            </button>
          </div>

          {/* Card 2: Importers & Clients Portal */}
          <div
            className="landing-card"
            style={{
              background: isDark
                ? "linear-gradient(150deg, rgba(32, 22, 14, 0.9) 0%, rgba(18, 12, 8, 0.95) 100%)"
                : "linear-gradient(150deg, rgba(255, 255, 255, 0.98), rgba(253, 248, 242, 0.98))",
              borderRadius: "20px",
              padding: "32px 28px",
              border: isDark ? "1px solid rgba(209, 160, 104, 0.35)" : "1px solid rgba(209, 160, 104, 0.35)",
              boxShadow: isDark
                ? "0 18px 45px rgba(0, 0, 0, 0.4), 0 0 30px rgba(209, 160, 104, 0.1)"
                : "0 14px 40px rgba(70, 30, 20, 0.08)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 800,
                  color: isDark ? "#dfa84a" : "#b37e33",
                  textTransform: "uppercase",
                  letterSpacing: "1.2px",
                  marginBottom: "8px",
                }}
              >
                Importadores & Torrefações
              </div>
              <h2 style={{ fontSize: "21px", fontWeight: 700, color: isDark ? "#ffffff" : "#1a0f0d", margin: "0 0 12px" }}>
                Portal do Cliente
              </h2>
              <p style={{ fontSize: "13.5px", color: isDark ? "#d4c4b6" : "#5c4d44", lineHeight: 1.55, margin: "0 0 28px" }}>
                Consulte os lotes vinculados ao seu contrato de compra e baixe os arquivos GeoJSON e relatórios auditados prontos para a UE.
              </p>
            </div>

            <button
              type="button"
              onClick={() => onOpenClientPortal?.()}
              style={{
                width: "100%",
                padding: "14px 20px",
                fontSize: "14px",
                fontWeight: 800,
                borderRadius: "12px",
                background: "linear-gradient(135deg, #d1a068 0%, #a8793e 100%)",
                color: "#1a0f0d",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                boxShadow: "0 8px 24px rgba(209, 160, 104, 0.3)",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              🌐 Acessar Portal do Cliente ➔
            </button>
          </div>

          {/* Card 3: Cloudflare R2 Storage */}
          <div
            className="landing-card"
            style={{
              background: isDark
                ? "linear-gradient(150deg, rgba(28, 16, 20, 0.9) 0%, rgba(15, 8, 10, 0.95) 100%)"
                : "linear-gradient(150deg, rgba(255, 255, 255, 0.98), rgba(253, 248, 242, 0.98))",
              borderRadius: "20px",
              padding: "32px 28px",
              border: isDark ? "1px solid rgba(189, 40, 32, 0.25)" : "1px solid rgba(209, 160, 104, 0.35)",
              boxShadow: isDark
                ? "0 18px 45px rgba(0, 0, 0, 0.4)"
                : "0 14px 40px rgba(70, 30, 20, 0.08)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 800,
                  color: isDark ? "#e03b31" : "#bd2820",
                  textTransform: "uppercase",
                  letterSpacing: "1.2px",
                  marginBottom: "8px",
                }}
              >
                Armazenamento em Nuvem R2
              </div>
              <h2 style={{ fontSize: "21px", fontWeight: 700, color: isDark ? "#ffffff" : "#1a0f0d", margin: "0 0 12px" }}>
                Cloud Explorer
              </h2>
              <p style={{ fontSize: "13.5px", color: isDark ? "#d4c4b6" : "#5c4d44", lineHeight: 1.55, margin: "0 0 28px" }}>
                Gerenciador completo de arquivos da nuvem, navegação por pastas regionais, visualização interativa e downloads diretos.
              </p>
            </div>

            <a
              href="https://cloud.fafeu.online"
              style={{
                padding: "14px 20px",
                fontSize: "14px",
                fontWeight: 800,
                borderRadius: "12px",
                background: isDark
                  ? "linear-gradient(135deg, #42201a 0%, #29120e 100%)"
                  : "linear-gradient(135deg, #faf3ec 0%, #eee1d3 100%)",
                color: isDark ? "#fcf9f5" : "#1a0f0d",
                textDecoration: "none",
                textAlign: "center",
                display: "block",
                border: "1px solid rgba(209, 160, 104, 0.35)",
                boxShadow: isDark
                  ? "0 8px 24px rgba(0, 0, 0, 0.3)"
                  : "0 4px 15px rgba(209, 160, 104, 0.15)",
                transition: "all 0.2s ease",
              }}
            >
              ☁️ Abrir Cloud Explorer ➔
            </a>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer
        style={{
          borderTop: isDark ? "1px solid rgba(209, 160, 104, 0.15)" : "1px solid rgba(209, 160, 104, 0.25)",
          padding: "24px 40px",
          textAlign: "center",
          color: isDark ? "#8e7c75" : "#7a6e66",
          fontSize: "12.5px",
          background: isDark ? "rgba(10, 4, 3, 0.8)" : "rgba(255, 255, 255, 0.85)",
        }}
      >
        FAF Coffees • Fazenda Ambiental Fortaleza • Plataforma Oficial de Sustentabilidade & Rastreabilidade EUDR
      </footer>
    </div>
  );
}
