"use client";

import React, { useState, useEffect, useMemo } from "react";

export interface PublishedPlotRecord {
  id: string;
  contractId: string;
  clientName?: string;
  plotId: string;
  producer?: string;
  supplier?: string;
  farm?: string;
  area?: number;
  geojsonKey: string;
  updatedAt?: string;
}

interface ClientPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  loggedUserRole?: "admin" | "operator" | "client" | "user";
  loggedClientName?: string;
  userName?: string;
  onLogout?: () => void;
}

interface AggregatedContractRecord {
  contractId: string;
  clientName: string;
  producer: string;
  farm: string;
  totalArea: number;
  geojsonKey: string;
  plotCount: number;
}

export function ClientPortalModal({
  isOpen,
  onClose,
  loggedUserRole = "operator",
  loggedClientName = "",
  userName = "",
  onLogout,
}: ClientPortalModalProps) {
  const [plots, setPlots] = useState<PublishedPlotRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [contractFilter, setContractFilter] = useState("TODOS");
  const [searchQuery, setSearchQuery] = useState("");
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

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
      const url = `/api/r2/list${
        params.toString() ? `?${params.toString()}` : ""
      }`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setPlots(data.plots || []);
      }
    } catch {
      setFeedback({
        type: "error",
        text: "Unable to load portal records from Cloudflare R2.",
      });
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
      setFeedback({
        type: "error",
        text: "File is not available in Cloudflare R2 storage.",
      });
      return;
    }
    setDownloadingKey(key);
    setFeedback(null);
    try {
      const res = await fetch(
        `/api/r2/download?key=${encodeURIComponent(key)}`
      );
      const data = await res.json();
      if (data.success && data.downloadUrl) {
        const a = document.createElement("a");
        a.href = data.downloadUrl;
        a.download = filename;
        a.target = "_blank";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        setFeedback({
          type: "success",
          text: `Download of ${filename} started successfully via Cloudflare R2!`,
        });
      } else {
        throw new Error(
          data.error || "Failed to retrieve secure download URL."
        );
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to download file.";
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
          (pClient &&
            (pClient.includes(targetClient) ||
              targetClient.includes(pClient))) ||
          (pProducer &&
            (pProducer.includes(targetClient) ||
              targetClient.includes(pProducer))) ||
          (pSupplier &&
            (pSupplier.includes(targetClient) ||
              targetClient.includes(pSupplier)))
        );
      });
    }
    return plots;
  }, [plots, loggedUserRole, loggedClientName]);

  // Agrupamento exclusivo por Contrato para atender ao pedido do usuário
  const aggregatedContracts = useMemo(() => {
    const map = new Map<string, AggregatedContractRecord>();

    clientScopedPlots.forEach((p) => {
      const contractCode = p.contractId || "SEM CONTRATO";
      if (!map.has(contractCode)) {
        map.set(contractCode, {
          contractId: contractCode,
          clientName: p.clientName || p.producer || "GENERAL CLIENT",
          producer: p.producer || "",
          farm: p.farm || "",
          totalArea: p.area || 0,
          geojsonKey: p.geojsonKey,
          plotCount: 1,
        });
      } else {
        const current = map.get(contractCode)!;
        current.totalArea += p.area || 0;
        current.plotCount += 1;
        if (!current.geojsonKey && p.geojsonKey) {
          current.geojsonKey = p.geojsonKey;
        }
      }
    });

    return Array.from(map.values());
  }, [clientScopedPlots]);

  const availableContracts = useMemo(() => {
    return aggregatedContracts.map((c) => c.contractId);
  }, [aggregatedContracts]);

  const filteredContracts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return aggregatedContracts.filter((c) => {
      if (contractFilter !== "TODOS" && c.contractId !== contractFilter) {
        return false;
      }
      if (!q) return true;
      return (
        c.contractId.toLowerCase().includes(q) ||
        c.clientName.toLowerCase().includes(q)
      );
    });
  }, [aggregatedContracts, contractFilter, searchQuery]);

  const totalVerifiedHectares = useMemo(() => {
    return filteredContracts.reduce((acc, c) => acc + (c.totalArea || 0), 0);
  }, [filteredContracts]);

  if (!isOpen) return null;

  const displayName =
    userName ||
    (loggedUserRole === "admin"
      ? "Administrator"
      : loggedUserRole === "client" && loggedClientName
      ? loggedClientName
      : "FAF Operator");

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "var(--canvas, #f3f5f2)",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        fontFamily:
          "'Segoe UI Variable', 'Segoe UI', -apple-system, sans-serif",
      }}
    >
      {/* Top Navbar */}
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
            style={{
              height: "42px",
              width: "auto",
              objectFit: "contain",
              display: "block",
            }}
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
            <h1
              style={{
                margin: 0,
                color: "#ffffff",
                fontSize: "19px",
                fontWeight: 700,
                letterSpacing: "-.02em",
              }}
            >
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
      <main
        style={{
          maxWidth: "1480px",
          margin: "0 auto",
          padding: "28px 28px 80px",
        }}
      >
        {/* Feedback Alert */}
        {feedback && (
          <div
            style={{
              marginBottom: "20px",
              padding: "14px 20px",
              borderRadius: "12px",
              background:
                feedback.type === "success" ? "#ecfdf5" : "#fef2f2",
              border:
                feedback.type === "success"
                  ? "1px solid #6ee7b7"
                  : "1px solid #fca5a5",
              color: feedback.type === "success" ? "#065f46" : "#991b1b",
              fontWeight: 700,
              fontSize: "13.5px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>
              {feedback.type === "success" ? "✅" : "⚠️"} {feedback.text}
            </span>
            <button
              onClick={() => setFeedback(null)}
              style={{
                background: "none",
                border: "none",
                fontSize: "16px",
                cursor: "pointer",
                color: "inherit",
              }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Hero Section */}
        <div
          style={{
            background:
              "linear-gradient(135deg, #092e20 0%, #134e38 50%, #1e6b4e 100%)",
            color: "#ffffff",
            padding: "36px 40px",
            borderRadius: "20px",
            marginBottom: "28px",
            boxShadow:
              "0 12px 30px rgba(9, 46, 32, 0.25), 0 4px 10px rgba(0,0,0,0.1)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{ maxWidth: "880px", position: "relative", zIndex: 1 }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: "rgba(255, 255, 255, 0.12)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                padding: "6px 14px",
                borderRadius: "999px",
                fontSize: "11px",
                fontWeight: 800,
                letterSpacing: ".08em",
                textTransform: "uppercase",
                marginBottom: "16px",
              }}
            >
              <span>🌿</span> EUDR COMPLIANCE DIRECTORY (EU 2023/1115)
            </div>
            <h2
              style={{
                margin: "0 0 10px",
                fontSize: "28px",
                fontWeight: 800,
                letterSpacing: "-.02em",
              }}
            >
              {loggedClientName
                ? `EUDR Contract Dossiers • ${loggedClientName}`
                : "EUDR Client Contract & GeoJSON Download Portal"}
            </h2>
            <p
              style={{
                margin: 0,
                fontSize: "14.5px",
                lineHeight: "1.6",
                color: "rgba(255, 255, 255, 0.88)",
                maxWidth: "760px",
              }}
            >
              Download polygon coordinates and EUDR compliance files validated
              against MapBiomas and Brazilian environmental databases for import
              customs clearance in the European Union.
            </p>
          </div>
        </div>

        {/* Executive KPI Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
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
              Verified Contracts
            </div>
            <div
              style={{
                fontSize: "28px",
                fontWeight: 800,
                color: "#1d4ed8",
                marginTop: "4px",
              }}
            >
              {filteredContracts.length}{" "}
              <span
                style={{
                  fontSize: "13px",
                  color: "var(--muted, #66736d)",
                  fontWeight: 500,
                }}
              >
                {filteredContracts.length === 1 ? "contract" : "contracts"}
              </span>
            </div>
            <div
              style={{
                fontSize: "12px",
                color: "var(--muted, #66736d)",
                marginTop: "4px",
              }}
            >
              Ready for EUDR GeoJSON downloads
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
              EUDR 2026 Compliance Status
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
            <div
              style={{
                fontSize: "12px",
                color: "var(--muted, #66736d)",
                marginTop: "6px",
              }}
            >
              Cloudflare R2 Global Storage ({totalVerifiedHectares.toFixed(2)} ha)
            </div>
          </div>
        </div>

        {/* Search By Contract Only */}
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
              placeholder="Search by contract number (e.g. 2026-C001)..."
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
                  ? `🌐 My Contracts (${availableContracts.length})`
                  : `🌐 All Contracts (${availableContracts.length})`}
              </option>
              {availableContracts.map((c) => (
                <option key={c} value={c}>
                  📋 Contract {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Main Contracts Table */}
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
            <div
              style={{
                padding: "80px 20px",
                textAlign: "center",
                color: "var(--muted, #66736d)",
              }}
            >
              <div style={{ fontSize: "36px", marginBottom: "12px" }}>⏳</div>
              <p
                style={{
                  margin: 0,
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "var(--forest-950, #102c24)",
                }}
              >
                Loading contracts and GeoJSON files from Cloudflare R2...
              </p>
              <p style={{ margin: "4px 0 0", fontSize: "13px" }}>
                Please wait while we verify your data.
              </p>
            </div>
          ) : filteredContracts.length === 0 ? (
            <div
              style={{
                padding: "80px 20px",
                textAlign: "center",
                color: "var(--muted, #66736d)",
              }}
            >
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>📂</div>
              <h4
                style={{
                  margin: 0,
                  fontSize: "19px",
                  color: "var(--forest-950, #102c24)",
                  fontWeight: 700,
                }}
              >
                No published contracts found
              </h4>
              <p
                style={{
                  margin: "8px 0 20px",
                  fontSize: "14px",
                  color: "var(--muted, #66736d)",
                }}
              >
                No contract records match your search criteria.
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
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  textAlign: "left",
                  fontSize: "13.5px",
                }}
              >
                <thead>
                  <tr
                    style={{
                      background: "var(--forest-50, #f2f7f4)",
                      borderBottom: "2px solid var(--line, #dce3de)",
                    }}
                  >
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
                      Contract Number
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
                      Total Verified Area
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
                      EUDR Status
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
                      EUDR GeoJSON Package (R2)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContracts.map((contract, idx) => (
                    <tr
                      key={contract.contractId || idx}
                      style={{
                        borderBottom:
                          idx === filteredContracts.length - 1
                            ? 0
                            : "1px solid var(--line, #dce3de)",
                        background: idx % 2 === 0 ? "#ffffff" : "#fdfefe",
                        transition: "background 0.15s ease",
                      }}
                    >
                      {/* Contract */}
                      <td style={{ padding: "18px 22px" }}>
                        <span
                          style={{
                            background: "#e0e7ff",
                            color: "#3730a3",
                            padding: "6px 12px",
                            borderRadius: "10px",
                            fontSize: "13px",
                            fontWeight: 800,
                            border: "1px solid #c7d2fe",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          📋 {contract.contractId}
                        </span>
                      </td>

                      {/* Client / Importer */}
                      <td style={{ padding: "18px 22px" }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                          }}
                        >
                          <div
                            style={{
                              width: "38px",
                              height: "38px",
                              borderRadius: "10px",
                              background: "#e0f2fe",
                              color: "#0369a1",
                              display: "grid",
                              placeItems: "center",
                              fontWeight: 800,
                              fontSize: "15px",
                            }}
                          >
                            🏢
                          </div>
                          <div>
                            <div
                              style={{
                                fontWeight: 800,
                                color: "var(--forest-950, #102c24)",
                                fontSize: "14px",
                              }}
                            >
                              {contract.clientName}
                            </div>
                            <div
                              style={{
                                fontSize: "12px",
                                color: "var(--muted, #66736d)",
                                marginTop: "2px",
                              }}
                            >
                              {contract.producer
                                ? `Producer: ${contract.producer}`
                                : "Cloudflare R2 Synchronized"}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Total Area */}
                      <td style={{ padding: "18px 22px" }}>
                        <div
                          style={{
                            fontWeight: 800,
                            color: "var(--forest-950, #102c24)",
                            fontSize: "14px",
                          }}
                        >
                          {contract.totalArea
                            ? `${contract.totalArea.toFixed(2)} ha`
                            : "N/A"}
                        </div>
                      </td>

                      {/* EUDR Status */}
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
                          <span>✓</span> Compliant & Verified
                        </span>
                      </td>

                      {/* Download Action */}
                      <td
                        style={{
                          padding: "18px 22px",
                          textAlign: "right",
                        }}
                      >
                        <button
                          onClick={() =>
                            handleDownload(
                              contract.geojsonKey,
                              `${contract.contractId}.geojson`
                            )
                          }
                          disabled={
                            downloadingKey === contract.geojsonKey ||
                            !contract.geojsonKey
                          }
                          style={{
                            padding: "10px 18px",
                            fontSize: "13px",
                            fontWeight: 800,
                            borderRadius: "10px",
                            border: "none",
                            background:
                              "linear-gradient(135deg, #092e20 0%, #134e38 100%)",
                            color: "#ffffff",
                            cursor: contract.geojsonKey
                              ? "pointer"
                              : "not-allowed",
                            opacity: contract.geojsonKey ? 1 : 0.6,
                            boxShadow: "0 4px 12px rgba(9, 46, 32, 0.2)",
                            transition: "all 0.15s ease",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "7px",
                          }}
                        >
                          {downloadingKey === contract.geojsonKey
                            ? "⏳ Downloading..."
                            : "🌐 Download Contract GeoJSON (.geojson)"}
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
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span style={{ color: "#10b981", fontSize: "16px" }}>⚡</span>
            <span>
              Cloudflare R2 Global Storage Infrastructure • Signed private links
              with SHA-256 integrity.
            </span>
          </div>
          <div>© 2026 FAF Coffees. All rights reserved.</div>
        </div>
      </main>
    </div>
  );
}
