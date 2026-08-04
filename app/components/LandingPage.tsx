"use client";

import React from "react";

interface LandingPageProps {
  onOpenFafApp?: () => void;
  onOpenClientPortal?: () => void;
}

export function LandingPage({ onOpenFafApp, onOpenClientPortal }: LandingPageProps) {

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "radial-gradient(ellipse at 50% 0%, #133324 0%, #091a13 50%, #050e0a 100%)",
        color: "#f1f6f3",
        fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Top Navbar */}
      <header
        style={{
          padding: "20px 36px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
          background: "rgba(9, 26, 19, 0.6)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <img
            src="/faf-symbol.png"
            alt="FAF Coffees"
            style={{ height: "36px", width: "auto", objectFit: "contain", display: "block" }}
          />
          <div>
            <div style={{ fontSize: "14px", fontWeight: 800, color: "#ffffff", letterSpacing: "0.5px" }}>
              FAF COFFEES
            </div>
            <div style={{ fontSize: "11px", color: "#d1a068", fontWeight: 600 }}>
              Fazenda Ambiental Fortaleza
            </div>
          </div>
        </div>

        <div>
          <span
            style={{
              fontSize: "12px",
              background: "rgba(16, 185, 129, 0.12)",
              color: "#34d399",
              border: "1px solid rgba(52, 211, 153, 0.25)",
              padding: "6px 14px",
              borderRadius: "999px",
              fontWeight: 700,
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#10b981" }}></span>
            Regulation (EU) 2023/1115 (EUDR)
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main
        style={{
          flex: 1,
          maxWidth: "1000px",
          width: "100%",
          margin: "0 auto",
          padding: "60px 24px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {/* Central Logo & Title */}
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <img
            src="/faf-symbol.png"
            alt="FAF Coffees"
            style={{
              height: "88px",
              width: "auto",
              objectFit: "contain",
              margin: "0 auto 24px",
              display: "block",
              filter: "drop-shadow(0 12px 28px rgba(179, 44, 37, 0.35))",
            }}
          />

          <h1
            style={{
              fontSize: "36px",
              fontWeight: 800,
              color: "#ffffff",
              margin: "0 0 12px",
              letterSpacing: "-0.8px",
            }}
          >
            EUDR Compliance Platform
          </h1>

          <p
            style={{
              fontSize: "16px",
              color: "#94a3b8",
              margin: 0,
              maxWidth: "540px",
            }}
          >
            Geospatial traceability and due diligence dossiers for specialty coffee exports.
          </p>
        </div>

        {/* 2 Primary Access Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "24px",
            width: "100%",
            maxWidth: "840px",
          }}
        >
          {/* Card 1: FAF Team */}
          <div
            style={{
              background: "linear-gradient(145deg, rgba(17, 43, 31, 0.8) 0%, rgba(10, 26, 19, 0.9) 100%)",
              borderRadius: "20px",
              padding: "32px 28px",
              border: "1px solid rgba(52, 211, 153, 0.2)",
              boxShadow: "0 16px 36px rgba(0, 0, 0, 0.3)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#34d399",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  marginBottom: "8px",
                }}
              >
                FAF Team
              </div>
              <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#ffffff", margin: "0 0 10px" }}>
                FAF Internal Portal
              </h2>
              <p style={{ fontSize: "13.5px", color: "#cbd5e1", lineHeight: 1.5, margin: "0 0 28px" }}>
                Restricted access for agronomists and technical staff to upload plots, validate deforestation on MapBiomas, and publish cloud dossiers.
              </p>
            </div>

            <a
              href="https://app.fafeu.online"
              onClick={(e) => {
                if (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")) {
                  e.preventDefault();
                  onOpenFafApp?.();
                }
              }}
              style={{
                padding: "13px 20px",
                fontSize: "14px",
                fontWeight: 700,
                borderRadius: "12px",
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                color: "#ffffff",
                textDecoration: "none",
                textAlign: "center",
                display: "block",
                boxShadow: "0 8px 20px rgba(16, 185, 129, 0.25)",
                transition: "all 0.15s ease",
              }}
            >
              🔒 Access FAF System ➔
            </a>
          </div>

          {/* Card 2: Importers & Clients */}
          <div
            style={{
              background: "linear-gradient(145deg, rgba(18, 32, 54, 0.8) 0%, rgba(10, 20, 36, 0.9) 100%)",
              borderRadius: "20px",
              padding: "32px 28px",
              border: "1px solid rgba(96, 165, 250, 0.2)",
              boxShadow: "0 16px 36px rgba(0, 0, 0, 0.3)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#93c5fd",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  marginBottom: "8px",
                }}
              >
                Importers & Roasters
              </div>
              <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#ffffff", margin: "0 0 10px" }}>
                Client Portal
              </h2>
              <p style={{ fontSize: "13.5px", color: "#cbd5e1", lineHeight: 1.5, margin: "0 0 28px" }}>
                Search lots by purchase contract and download verified GeoJSON files ready for EU Due Diligence submission.
              </p>
            </div>

            <a
              href="https://portal.fafeu.online"
              onClick={(e) => {
                if (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")) {
                  e.preventDefault();
                  onOpenClientPortal?.();
                }
              }}
              style={{
                padding: "13px 20px",
                fontSize: "14px",
                fontWeight: 700,
                borderRadius: "12px",
                background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                color: "#ffffff",
                textDecoration: "none",
                textAlign: "center",
                display: "block",
                boxShadow: "0 8px 20px rgba(37, 99, 235, 0.25)",
                transition: "all 0.15s ease",
              }}
            >
              🌐 Access Client Portal ➔
            </a>
          </div>

          {/* Card 3: FAF Cloud Storage (cloud.fafeu.online) */}
          <div
            style={{
              background: "linear-gradient(145deg, rgba(30, 27, 75, 0.8) 0%, rgba(15, 14, 38, 0.9) 100%)",
              borderRadius: "20px",
              padding: "32px 28px",
              border: "1px solid rgba(167, 139, 250, 0.2)",
              boxShadow: "0 16px 36px rgba(0, 0, 0, 0.3)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#c4b5fd",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  marginBottom: "8px",
                }}
              >
                Cloudflare R2 Storage
              </div>
              <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#ffffff", margin: "0 0 10px" }}>
                Cloud Explorer
              </h2>
              <p style={{ fontSize: "13.5px", color: "#cbd5e1", lineHeight: 1.5, margin: "0 0 28px" }}>
                Visualize, download, upload and delete raw geometries, datasets, dossiers and metadata in real-time.
              </p>
            </div>

            <a
              href="/cloud"
              style={{
                padding: "13px 20px",
                fontSize: "14px",
                fontWeight: 700,
                borderRadius: "12px",
                background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
                color: "#ffffff",
                textDecoration: "none",
                textAlign: "center",
                display: "block",
                boxShadow: "0 8px 20px rgba(124, 58, 237, 0.25)",
                transition: "all 0.15s ease",
              }}
            >
              ☁️ Access Cloud Storage ➔
            </a>
          </div>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer
        style={{
          padding: "20px 36px",
          borderTop: "1px solid rgba(255, 255, 255, 0.05)",
          textAlign: "center",
          fontSize: "12px",
          color: "#64748b",
        }}
      >
        © {new Date().getFullYear()} <strong>FAF Coffees</strong> • Mococa, SP — Brazil • Regulation (EU) 2023/1115
      </footer>
    </div>
  );
}
