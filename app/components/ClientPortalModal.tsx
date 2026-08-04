"use client";

import React, { useState, useEffect, useMemo } from "react";
import { PublishedPlotRecord } from "@/app/lib/clientPortalStore";

interface ClientPortalModalProps {
  isOpen?: boolean;
  onClose: () => void;
  userName?: string;
  loggedUserRole?: "admin" | "user" | "client";
  loggedClientName?: string;
  onLogout?: () => void;
}

export default function ClientPortalModal({
  isOpen = true,
  onClose,
  userName = "Authorized User",
  loggedUserRole = "user",
  loggedClientName = "",
  onLogout,
}: ClientPortalModalProps) {
  const [plots, setPlots] = useState<PublishedPlotRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [contractFilter, setContractFilter] = useState("TODOS");
  const [searchQuery, setSearchQuery] = useState("");
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchPlots = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (contractFilter !== "TODOS") {
        params.set("contractId", contractFilter);
      }
      if (loggedUserRole === "client" && loggedClientName) {
        params.set("clientName", loggedClientName);
      }
      const url = `/api/r2/list${params.toString() ? `?${params.toString()}` : ""}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setPlots(data.plots || []);
      }
    } catch {
      setFeedback({ type: "error", text: "Unable to load portal records from Cloudflare R2." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPlots();
    }
  }, [isOpen, contractFilter, loggedUserRole, loggedClientName]);

  const handleDownload = async (key: string, filename: string) => {
    if (!key) {
      setFeedback({ type: "error", text: "File is not available in Cloudflare R2 storage." });
      return;
    }
    setDownloadingKey(key);
    setFeedback(null);
    try {
      const res = await fetch(`/api/r2/download?key=${encodeURIComponent(key)}`);
      const data = await res.json();
      if (data.success && data.downloadUrl) {
        const a = document.createElement("a");
        a.href = data.downloadUrl;
        a.download = filename;
        a.target = "_blank";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        setFeedback({ type: "success", text: `Download of ${filename} started successfully via Cloudflare R2!` });
      } else {
        throw new Error(data.error || "Failed to retrieve secure download URL.");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to download file.";
      setFeedback({ type: "error", text: msg });
    } finally {
      setDownloadingKey(null);
    }
  };

  const clientScopedPlots = useMemo(() => {
    if (loggedUserRole === "client" && loggedClientName) {
      const targetClient = loggedClientName.toLowerCase().trim();
      return plots.filter((plot) => {
        const pClient = (plot.clientName || "").toLowerCase().trim();
        const pProducer = (plot.producer || "").toLowerCase().trim();
        const pSupplier = (plot.supplier || "").toLowerCase().trim();
        return (
          (pClient && (pClient.includes(targetClient) || targetClient.includes(pClient))) ||
          (pProducer && (pProducer.includes(targetClient) || targetClient.includes(pProducer))) ||
          (pSupplier && (pSupplier.includes(targetClient) || targetClient.includes(pSupplier)))
        );
      });
    }
    return plots;
  }, [plots, loggedUserRole, loggedClientName]);

  const availableContracts = useMemo(() => {
    return Array.from(new Set(clientScopedPlots.map((p) => p.contractId).filter(Boolean)));
  }, [clientScopedPlots]);

  const filteredPlots = useMemo(() => {
    return clientScopedPlots.filter((plot) => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        (plot.clientName || "").toLowerCase().includes(q) ||
        (plot.producer || "").toLowerCase().includes(q) ||
        plot.contractId.toLowerCase().includes(q) ||
        plot.plotId.toLowerCase().includes(q) ||
        (plot.farm || "").toLowerCase().includes(q)
      );
    });
  }, [clientScopedPlots, searchQuery]);

  const totalHectares = useMemo(() => {
    return filteredPlots.reduce((acc, p) => acc + (p.area || 0), 0);
  }, [filteredPlots]);

  // Compute clean display name without any email address
  const displayName = useMemo(() => {
    let raw = (userName || "").trim();
    if (raw.includes("@")) {
      raw = raw.split("@")[0];
    }
    if (loggedClientName && loggedClientName.trim() && loggedClientName.toLowerCase() !== raw.toLowerCase()) {
      return `${raw} (${loggedClientName})`;
    }
    return raw || loggedClientName || "Authorized User";
  }, [userName, loggedClientName]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--canvas, #f3f5f2)",
        color: "var(--ink, #18211d)",
        fontFamily: "'Segoe UI Variable', 'Segoe UI', -apple-system, sans-serif",
      }}
    >
      {/* Top Navbar Matching corporate FAF EUDR design */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          background: "#102c24",
          color: "#ffffff",
          padding: "0 max(28px, calc((100vw - 1480px) / 2))",
          height: "76px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <img
            src="/faf-symbol.png"
            alt="FAF Coffees"
            style={{ height: "42px", width: "auto", objectFit: "contain", display: "block" }}
          />
          <div>
            <p
              style={{
                margin: "0 0 2px",
                color: "var(--orange-500, #d77442)",
                fontSize: "11px",
                fontWeight: 800,
                letterSpacing: ".12em",
                textTransform: "uppercase",
              }}
            >
              PORTAL.FAFEU.ONLINE • CLOUDFLARE R2 STORAGE
            </p>
            <h1 style={{ margin: 0, color: "#ffffff", fontSize: "19px", fontWeight: 700, letterSpacing: "-.02em" }}>
              Client Portal & EUDR Dossiers
            </h1>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {loggedClientName ? (
            <span
              style={{
                background: "rgba(52, 211, 153, 0.18)",
                border: "1px solid rgba(52, 211, 153, 0.35)",
                color: "#34d399",
                padding: "6px 14px",
                borderRadius: "999px",
                fontSize: "12px",
                fontWeight: 800,
                letterSpacing: "0.5px",
              }}
            >
              🏢 {loggedClientName.toUpperCase()}
            </span>
          ) : (
            <span
              style={{
                background: "rgba(255, 255, 255, 0.12)",
                border: "1px solid rgba(255, 255, 255, 0.22)",
                color: "#e2e8f0",
                padding: "6px 12px",
                borderRadius: "999px",
                fontSize: "12px",
                fontWeight: 700,
              }}
            >
              {loggedUserRole === "admin" ? "🛡️ ADMIN" : "👤 OPERATOR"}
            </span>
          )}

          <span
            style={{
              color: "#d1fae5",
              fontSize: "13px",
              fontWeight: 600,
              background: "rgba(255,255,255,0.08)",
              padding: "6px 14px",
              borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            👤 {displayName}
          </span>

          <button
            onClick={onClose}
            style={{
              background: "rgba(255, 255, 255, 0.12)",
              border: "1px solid rgba(255, 255, 255, 0.22)",
              color: "#ffffff",
              padding: "8px 16px",
              borderRadius: "8px",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            🏠 Home
          </button>

          {onLogout && (
            <button
              onClick={onLogout}
              style={{
                background: "rgba(239, 68, 68, 0.2)",
                border: "1px solid rgba(239, 68, 68, 0.4)",
                color: "#fca5a5",
                padding: "8px 16px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              🚪 Log Out
            </button>
          )}
        </div>
      </header>

      {/* Main Page Layout */}
      <main style={{ maxWidth: "1480px", margin: "0 auto", padding: "28px 28px 80px" }}>
        {/* Feedback Alert */}
        {feedback && (
          <div
            style={{
              marginBottom: "20px",
              padding: "14px 20px",
              borderRadius: "12px",
              background: feedback.type === "success" ? "#ecfdf5" : "#fef2f2",
              color: feedback.type === "success" ? "#065f46" : "#991b1b",
              border: `1px solid ${feedback.type === "success" ? "#a7f3d0" : "#fecaca"}`,
              fontSize: "13.5px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontWeight: 600,
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            }}
          >
            <span>{feedback.text}</span>
            <button
              onClick={() => setFeedback(null)}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "inherit",
                fontSize: "16px",
                fontWeight: 700,
              }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Hero Header Overview */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            flexWrap: "wrap",
            gap: "20px",
            marginBottom: "28px",
          }}
        >
          <div>
            <p
              style={{
                margin: "0 0 6px",
                color: "var(--orange-500, #d77442)",
                fontSize: "11px",
                fontWeight: 800,
                letterSpacing: ".12em",
                textTransform: "uppercase",
              }}
            >
              FAF COFFEES • VERIFIED COMPLIANCE ARCHIVE
            </p>
            <h2
              style={{
                margin: 0,
                color: "var(--forest-950, #102c24)",
                fontSize: "30px",
                fontWeight: 800,
                letterSpacing: "-0.03em",
              }}
            >
              EUDR Lots & GeoJSON Downloads
            </h2>
            <p
              style={{
                margin: "8px 0 0",
                color: "var(--muted, #66736d)",
                fontSize: "14px",
                maxWidth: "760px",
                lineHeight: "1.5",
              }}
            >
              Access verified coffee parcel coordinates, plot metadata, and download signed GeoJSON geometry files
              directly from Cloudflare R2 secure storage.
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <button
              onClick={fetchPlots}
              style={{
                background: "#ffffff",
                border: "1px solid var(--line-strong, #c8d3cc)",
                color: "var(--forest-900, #173b30)",
                padding: "10px 18px",
                borderRadius: "10px",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              }}
            >
              🔄 Refresh Data
            </button>
          </div>
        </div>

        {/* Executive KPI Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "16px",
            marginBottom: "28px",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              padding: "20px 24px",
              borderRadius: "16px",
              border: "1px solid var(--line, #dce3de)",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                fontWeight: 800,
                color: "var(--subtle, #8a958f)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Listed Plots
            </div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "var(--forest-950, #102c24)", marginTop: "4px" }}>
              {filteredPlots.length} <span style={{ fontSize: "13px", color: "var(--muted, #66736d)", fontWeight: 500 }}>plots</span>
            </div>
            <div style={{ fontSize: "12px", color: "var(--muted, #66736d)", marginTop: "4px" }}>
              Available for download
            </div>
          </div>

          <div
            style={{
              background: "#ffffff",
              padding: "20px 24px",
              borderRadius: "16px",
              border: "1px solid var(--line, #dce3de)",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                fontWeight: 800,
                color: "var(--subtle, #8a958f)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Total Mapped Area
            </div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#065f46", marginTop: "4px" }}>
              {totalHectares.toFixed(2)}{" "}
              <span style={{ fontSize: "13px", color: "var(--muted, #66736d)", fontWeight: 500 }}>hectares</span>
            </div>
            <div style={{ fontSize: "12px", color: "#10b981", fontWeight: 700, marginTop: "4px" }}>
              ✓ 100% Polygon Verified
            </div>
          </div>

          <div
            style={{
              background: "#ffffff",
              padding: "20px 24px",
              borderRadius: "16px",
              border: "1px solid var(--line, #dce3de)",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                fontWeight: 800,
                color: "var(--subtle, #8a958f)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Cloud Contracts
            </div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#1d4ed8", marginTop: "4px" }}>
              {availableContracts.length}{" "}
              <span style={{ fontSize: "13px", color: "var(--muted, #66736d)", fontWeight: 500 }}>contracts</span>
            </div>
            <div style={{ fontSize: "12px", color: "var(--muted, #66736d)", marginTop: "4px" }}>
              Active export lots
            </div>
          </div>

          <div
            style={{
              background: "#ffffff",
              padding: "20px 24px",
              borderRadius: "16px",
              border: "1px solid var(--line, #dce3de)",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                fontWeight: 800,
                color: "var(--subtle, #8a958f)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              EUDR 2026 Compliance
            </div>
            <div
              style={{
                fontSize: "16px",
                fontWeight: 800,
                color: "#047857",
                marginTop: "10px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  background: "#10b981",
                  boxShadow: "0 0 0 3px rgba(16,185,129,0.2)",
                }}
              ></span>
              Compliant & Verified
            </div>
            <div style={{ fontSize: "12px", color: "var(--muted, #66736d)", marginTop: "6px" }}>
              Cloudflare R2 Storage
            </div>
          </div>
        </div>

        {/* Search & Filter Card */}
        <div
          style={{
            background: "#ffffff",
            padding: "20px 24px",
            borderRadius: "16px",
            border: "1px solid var(--line, #dce3de)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            marginBottom: "24px",
            display: "flex",
            gap: "16px",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <div style={{ flex: "1 1 360px", position: "relative" }}>
            <span
              style={{
                position: "absolute",
                left: "16px",
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: "16px",
                color: "#94a3b8",
              }}
            >
              🔍
            </span>
            <input
              type="text"
              placeholder="Search by client, contract, plot code, producer, or farm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 16px 12px 44px",
                fontSize: "14px",
                borderRadius: "12px",
                border: "1px solid var(--line-strong, #c8d3cc)",
                outline: "none",
                background: "var(--canvas, #f3f5f2)",
                fontWeight: 500,
              }}
            />
          </div>

          <div style={{ flex: "0 0 280px" }}>
            <select
              value={contractFilter}
              onChange={(e) => setContractFilter(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 16px",
                fontSize: "14px",
                borderRadius: "12px",
                border: "1px solid var(--line-strong, #c8d3cc)",
                background: "var(--canvas, #f3f5f2)",
                fontWeight: 700,
                color: "var(--forest-950, #102c24)",
                cursor: "pointer",
              }}
            >
              <option value="TODOS">
                {loggedUserRole === "client"
                  ? `🌐 My Contracts (${clientScopedPlots.length})`
                  : `🌐 All Contracts (${plots.length})`}
              </option>
              {availableContracts.map((c) => (
                <option key={c} value={c}>
                  📋 Contract {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Main Table Card */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "18px",
            border: "1px solid var(--line, #dce3de)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            overflow: "hidden",
          }}
        >
          {loading ? (
            <div style={{ padding: "80px 20px", textAlign: "center", color: "var(--muted, #66736d)" }}>
              <div style={{ fontSize: "36px", marginBottom: "12px" }}>⏳</div>
              <p style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "var(--forest-950, #102c24)" }}>
                Loading plots and files from Cloudflare R2...
              </p>
              <p style={{ margin: "4px 0 0", fontSize: "13px" }}>Please wait while we verify your data.</p>
            </div>
          ) : filteredPlots.length === 0 ? (
            <div style={{ padding: "80px 20px", textAlign: "center", color: "var(--muted, #66736d)" }}>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>📂</div>
              <h4 style={{ margin: 0, fontSize: "19px", color: "var(--forest-950, #102c24)", fontWeight: 700 }}>
                No published plots found
              </h4>
              <p style={{ margin: "8px 0 20px", fontSize: "14px", color: "var(--muted, #66736d)" }}>
                No plot records match your current filter or search criteria.
              </p>
              {(contractFilter !== "TODOS" || searchQuery.trim()) && (
                <button
                  onClick={() => {
                    setContractFilter("TODOS");
                    setSearchQuery("");
                  }}
                  style={{
                    padding: "10px 20px",
                    fontSize: "13px",
                    fontWeight: 700,
                    borderRadius: "10px",
                    border: "1px solid var(--line-strong, #c8d3cc)",
                    background: "var(--canvas, #f3f5f2)",
                    color: "var(--forest-900, #173b30)",
                    cursor: "pointer",
                  }}
                >
                  Clear Filters & Show All
                </button>
              )}
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13.5px" }}>
                <thead>
                  <tr style={{ background: "var(--forest-50, #f2f7f4)", borderBottom: "2px solid var(--line, #dce3de)" }}>
                    <th
                      style={{
                        padding: "16px 22px",
                        color: "var(--forest-950, #102c24)",
                        fontWeight: 800,
                        fontSize: "12px",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      Client / Importer
                    </th>
                    <th
                      style={{
                        padding: "16px 22px",
                        color: "var(--forest-950, #102c24)",
                        fontWeight: 800,
                        fontSize: "12px",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      Contract
                    </th>
                    <th
                      style={{
                        padding: "16px 22px",
                        color: "var(--forest-950, #102c24)",
                        fontWeight: 800,
                        fontSize: "12px",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      Plot Code
                    </th>
                    <th
                      style={{
                        padding: "16px 22px",
                        color: "var(--forest-950, #102c24)",
                        fontWeight: 800,
                        fontSize: "12px",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      Area (ha)
                    </th>
                    <th
                      style={{
                        padding: "16px 22px",
                        color: "var(--forest-950, #102c24)",
                        fontWeight: 800,
                        fontSize: "12px",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        textAlign: "right",
                      }}
                    >
                      GeoJSON File (R2)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPlots.map((plot, idx) => (
                    <tr
                      key={plot.id || idx}
                      style={{
                        borderBottom: idx === filteredPlots.length - 1 ? 0 : "1px solid var(--line, #dce3de)",
                        background: idx % 2 === 0 ? "#ffffff" : "#fdfefe",
                        transition: "background 0.15s ease",
                      }}
                    >
                      {/* Client / Producer / Farm */}
                      <td style={{ padding: "18px 22px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div
                            style={{
                              width: "40px",
                              height: "40px",
                              borderRadius: "12px",
                              background: "#e0f2fe",
                              color: "#0369a1",
                              display: "grid",
                              placeItems: "center",
                              fontWeight: 800,
                              fontSize: "16px",
                            }}
                          >
                            🏢
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, color: "var(--forest-950, #102c24)", fontSize: "14px" }}>
                              {plot.clientName || plot.producer || "GENERAL CLIENT"}
                            </div>
                            <div style={{ fontSize: "12px", color: "var(--muted, #66736d)", marginTop: "2px" }}>
                              {plot.producer && plot.producer !== plot.clientName ? `Producer: ${plot.producer} • ` : ""}
                              {plot.farm ? `Farm: ${plot.farm}` : "Cloud R2"}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contract */}
                      <td style={{ padding: "18px 22px" }}>
                        <span
                          style={{
                            background: "#e0e7ff",
                            color: "#3730a3",
                            padding: "6px 12px",
                            borderRadius: "10px",
                            fontSize: "12px",
                            fontWeight: 800,
                            border: "1px solid #c7d2fe",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          📋 {plot.contractId}
                        </span>
                      </td>

                      {/* Plot Code */}
                      <td style={{ padding: "18px 22px" }}>
                        <span
                          style={{
                            background: "#ecfdf5",
                            color: "#065f46",
                            padding: "6px 12px",
                            borderRadius: "10px",
                            fontSize: "12px",
                            fontWeight: 800,
                            border: "1px solid #a7f3d0",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          🌱 {plot.plotId}
                        </span>
                      </td>

                      {/* Area */}
                      <td style={{ padding: "18px 22px" }}>
                        <div style={{ fontWeight: 800, color: "var(--forest-950, #102c24)", fontSize: "14px" }}>
                          {plot.area ? `${plot.area.toFixed(2)} ha` : "N/A"}
                        </div>
                        <div
                          style={{
                            fontSize: "11px",
                            color: "#10b981",
                            fontWeight: 700,
                            marginTop: "2px",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <span>✓</span> EUDR Verified
                        </div>
                      </td>

                      {/* Download Action */}
                      <td style={{ padding: "18px 22px", textAlign: "right" }}>
                        <button
                          onClick={() => handleDownload(plot.geojsonKey, `${plot.plotId}.geojson`)}
                          disabled={downloadingKey === plot.geojsonKey}
                          style={{
                            padding: "10px 18px",
                            fontSize: "13px",
                            fontWeight: 800,
                            borderRadius: "10px",
                            border: "none",
                            background: "linear-gradient(135deg, #092e20 0%, #134e38 100%)",
                            color: "#ffffff",
                            cursor: "pointer",
                            boxShadow: "0 4px 12px rgba(9, 46, 32, 0.2)",
                            transition: "all 0.15s ease",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "7px",
                          }}
                        >
                          {downloadingKey === plot.geojsonKey ? "⏳ Downloading..." : "🌐 Download GeoJSON (.geojson)"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Bottom Info Banner */}
        <div
          style={{
            marginTop: "32px",
            padding: "20px 24px",
            borderRadius: "14px",
            background: "#ffffff",
            border: "1px solid var(--line, #dce3de)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
            fontSize: "12.5px",
            color: "var(--muted, #66736d)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ color: "#10b981", fontSize: "16px" }}>⚡</span>
            <span>Cloudflare R2 Global Storage Infrastructure • Signed private links with SHA-256 integrity.</span>
          </div>
          <div>© 2026 FAF Coffees. All rights reserved.</div>
        </div>
      </main>
    </div>
  );
}
