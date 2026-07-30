"use client";

import React from "react";

interface LandingPageProps {
  onOpenFafApp: () => void;
  onOpenClientPortal: () => void;
}

export function LandingPage({ onOpenFafApp, onOpenClientPortal }: LandingPageProps) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(145deg, #071c14 0%, #0d2b1f 50%, #05140e 100%)",
        color: "#f0f7f3",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Top Navbar */}
      <header
        style={{
          padding: "20px 40px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          background: "rgba(7, 28, 20, 0.8)",
          backdropFilter: "blur(12px)",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div
            style={{
              background: "#15803d",
              color: "#fff",
              fontWeight: 900,
              fontSize: "18px",
              padding: "6px 12px",
              borderRadius: "8px",
              letterSpacing: "1px",
            }}
          >
            FAF
          </div>
          <div>
            <div style={{ fontSize: "11px", color: "#6ee7b7", fontWeight: 700, letterSpacing: "1.5px" }}>
              FAF COFFEES • EUDR COMPLIANCE
            </div>
            <div style={{ fontSize: "16px", fontWeight: 700, color: "#fff" }}>
              Plataforma de Conformidade EUDR
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <span
            style={{
              fontSize: "11px",
              background: "rgba(16, 185, 129, 0.15)",
              color: "#34d399",
              border: "1px solid rgba(52, 211, 153, 0.3)",
              padding: "4px 10px",
              borderRadius: "999px",
              fontWeight: 700,
            }}
          >
            ● Regulamento (UE) 2023/1115
          </span>
          <button
            onClick={onOpenFafApp}
            style={{
              background: "rgba(255, 255, 255, 0.1)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              color: "#fff",
              padding: "8px 16px",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Entrar
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main style={{ flex: 1, maxW: "1200px", width: "100%", margin: "0 auto", padding: "60px 24px" }}>
        <div style={{ textAlign: "center", maxWidth: "800px", margin: "0 auto 60px" }}>
          <div
            style={{
              display: "inline-block",
              background: "rgba(21, 128, 61, 0.2)",
              color: "#6ee7b7",
              border: "1px solid rgba(110, 231, 183, 0.3)",
              padding: "6px 16px",
              borderRadius: "999px",
              fontSize: "12px",
              fontWeight: 700,
              marginBottom: "20px",
              letterSpacing: "0.5px",
            }}
          >
            🌿 SUSTENTABILIDADE & RASTREABILIDADE DO CAFÉ
          </div>
          <h1
            style={{
              fontSize: "44px",
              fontWeight: 800,
              color: "#ffffff",
              margin: "0 0 20px",
              lineHeight: 1.15,
              letterSpacing: "-1px",
            }}
          >
            Mapeamento Geoespacial e Dossiês EUDR da FAF Coffees
          </h1>
          <p style={{ fontSize: "17px", color: "#a7f3d0", lineHeight: 1.6, margin: 0 }}>
            Plataforma corporativa para validação de desmatamento no Global Forest Watch (GFW), geração de arquivos GeoJSON e distribuição segura de dossiês de rastreabilidade para a União Europeia.
          </p>
        </div>

        {/* 2 Main Call to Action Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "28px",
            marginBottom: "70px",
          }}
        >
          {/* Card 1: Equipe FAF */}
          <div
            style={{
              background: "linear-gradient(135deg, rgba(15, 45, 34, 0.9) 0%, rgba(8, 28, 20, 0.95) 100%)",
              borderRadius: "24px",
              padding: "36px",
              border: "1px solid rgba(52, 211, 153, 0.25)",
              boxShadow: "0 20px 50px rgba(0, 0, 0, 0.4)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "-40px",
                right: "-40px",
                width: "140px",
                height: "140px",
                background: "rgba(16, 185, 129, 0.1)",
                borderRadius: "50%",
                blur: "40px",
              }}
            />
            <div>
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "16px",
                  background: "rgba(16, 185, 129, 0.15)",
                  border: "1px solid rgba(52, 211, 153, 0.3)",
                  display: "grid",
                  placeItems: "center",
                  fontSize: "26px",
                  marginBottom: "24px",
                }}
              >
                🔒
              </div>
              <h3 style={{ fontSize: "24px", fontWeight: 700, color: "#fff", margin: "0 0 12px" }}>
                Área Restrita FAF
              </h3>
              <p style={{ fontSize: "14px", color: "#cbd5e1", lineHeight: 1.6, margin: "0 0 24px" }}>
                Acesso exclusivo para funcionários da FAF Coffees. Permite importar KML/GeoJSON, consultar análises temporais no GFW, validar o CAR e publicar os arquivos na nuvem Cloudflare R2.
              </p>
              <ul style={{ paddingLeft: "20px", color: "#a7f3d0", fontSize: "13px", lineHeight: 1.8, margin: "0 0 30px" }}>
                <li>Validação temporal GFW (2024–Presente)</li>
                <li>Geração automática do Código FAF de Talhão</li>
                <li>Publicação estruturada no Cloudflare R2</li>
              </ul>
            </div>
            <button
              onClick={onOpenFafApp}
              style={{
                width: "100%",
                padding: "14px 24px",
                fontSize: "15px",
                fontWeight: 700,
                borderRadius: "12px",
                border: "none",
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                color: "#fff",
                cursor: "pointer",
                boxShadow: "0 10px 25px rgba(16, 185, 129, 0.3)",
                transition: "transform 0.15s ease",
              }}
            >
              🔒 Acessar Área FAF ➔
            </button>
          </div>

          {/* Card 2: Portal do Cliente */}
          <div
            style={{
              background: "linear-gradient(135deg, rgba(17, 34, 64, 0.9) 0%, rgba(10, 20, 40, 0.95) 100%)",
              borderRadius: "24px",
              padding: "36px",
              border: "1px solid rgba(96, 165, 250, 0.25)",
              boxShadow: "0 20px 50px rgba(0, 0, 0, 0.4)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "-40px",
                right: "-40px",
                width: "140px",
                height: "140px",
                background: "rgba(59, 130, 246, 0.1)",
                borderRadius: "50%",
                blur: "40px",
              }}
            />
            <div>
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "16px",
                  background: "rgba(59, 130, 246, 0.15)",
                  border: "1px solid rgba(96, 165, 250, 0.3)",
                  display: "grid",
                  placeItems: "center",
                  fontSize: "26px",
                  marginBottom: "24px",
                }}
              >
                🌐
              </div>
              <h3 style={{ fontSize: "24px", fontWeight: 700, color: "#fff", margin: "0 0 12px" }}>
                Portal do Cliente & Importador
              </h3>
              <p style={{ fontSize: "14px", color: "#cbd5e1", lineHeight: 1.6, margin: "0 0 24px" }}>
                Espaço dedicado aos importadores e torrefadores parceiros. Permite consultar os talhões vinculados aos seus contratos e baixar os arquivos `.geojson` para submissão à UE.
              </p>
              <ul style={{ paddingLeft: "20px", color: "#93c5fd", fontSize: "13px", lineHeight: 1.8, margin: "0 0 30px" }}>
                <li>Filtro direto por Código de Contrato</li>
                <li>Download em 1-clique do GeoJSON padronizado</li>
                <li>Links privados seguros via Cloudflare R2</li>
              </ul>
            </div>
            <button
              onClick={onOpenClientPortal}
              style={{
                width: "100%",
                padding: "14px 24px",
                fontSize: "15px",
                fontWeight: 700,
                borderRadius: "12px",
                border: "none",
                background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                color: "#fff",
                cursor: "pointer",
                boxShadow: "0 10px 25px rgba(37, 99, 235, 0.3)",
                transition: "transform 0.15s ease",
              }}
            >
              🌐 Acessar Portal do Cliente ➔
            </button>
          </div>
        </div>

        {/* Feature Grid Section */}
        <div style={{ borderTop: "1px solid rgba(255, 255, 255, 0.1)", paddingTop: "50px" }}>
          <h4 style={{ textAlign: "center", fontSize: "20px", fontWeight: 700, color: "#fff", marginBottom: "36px" }}>
            Recursos da Infraestrutura EUDR FAF Coffees
          </h4>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px" }}>
            <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: "20px", borderRadius: "16px", border: "1px solid rgba(255, 255, 255, 0.06)" }}>
              <div style={{ fontSize: "20px", marginBottom: "8px" }}>🌲</div>
              <h5 style={{ margin: "0 0 6px", color: "#fff", fontSize: "15px" }}>Global Forest Watch</h5>
              <p style={{ margin: 0, fontSize: "12px", color: "#94a3b8", lineHeight: 1.5 }}>
                Análise automatizada da série temporal de cobertura florestal a partir do início de 2024.
              </p>
            </div>

            <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: "20px", borderRadius: "16px", border: "1px solid rgba(255, 255, 255, 0.06)" }}>
              <div style={{ fontSize: "20px", marginBottom: "8px" }}>⚡</div>
              <h5 style={{ margin: "0 0 6px", color: "#fff", fontSize: "15px" }}>Cloudflare R2 Storage</h5>
              <p style={{ margin: 0, fontSize: "12px", color: "#94a3b8", lineHeight: 1.5 }}>
                Armazenamento em nuvem ultra-rápido organizado por Região, Fornecedor e Fazenda.
              </p>
            </div>

            <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: "20px", borderRadius: "16px", border: "1px solid rgba(255, 255, 255, 0.06)" }}>
              <div style={{ fontSize: "20px", marginBottom: "8px" }}>🌐</div>
              <h5 style={{ margin: "0 0 6px", color: "#fff", fontSize: "15px" }}>Padrão GeoJSON OGC</h5>
              <p style={{ margin: 0, fontSize: "12px", color: "#94a3b8", lineHeight: 1.5 }}>
                Arquivos geométricos em sistema de referência CRS84 totalmente válidos para a UE.
              </p>
            </div>

            <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: "20px", borderRadius: "16px", border: "1px solid rgba(255, 255, 255, 0.06)" }}>
              <div style={{ fontSize: "20px", marginBottom: "8px" }}>📜</div>
              <h5 style={{ margin: "0 0 6px", color: "#fff", fontSize: "15px" }}>Trilha de Auditoria</h5>
              <p style={{ margin: 0, fontSize: "12px", color: "#94a3b8", lineHeight: 1.5 }}>
                Registro imutável de todas as análises e exportações para governança e Due Diligence.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer
        style={{
          padding: "24px 40px",
          borderTop: "1px solid rgba(255, 255, 255, 0.08)",
          background: "rgba(5, 20, 14, 0.9)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          fontSize: "12px",
          color: "#64748b",
        }}
      >
        <div>
          © {new Date().getFullYear()} <strong>FAF Coffees</strong> • Todos os direitos reservados.
        </div>
        <div>
          Plataforma Corporativa de Conformidade EUDR • União Europeia Regulamento 2023/1115
        </div>
      </footer>
    </div>
  );
}
