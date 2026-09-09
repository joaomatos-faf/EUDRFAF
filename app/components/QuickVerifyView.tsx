"use client";

import React, { useState, useCallback, useMemo, ChangeEvent, DragEvent } from "react";
import dynamic from "next/dynamic";
import {
  type GeometryData,
  calculateAreaHectares,
  validatePolygonTopology,
  parseGeometryFile,
  buildEudrGeoJson,
  downloadBlob,
} from "../lib/eudr";
import type { MapbiomasCheck } from "../lib/types";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageToggle } from "./ui/LanguageToggle";
import { useTranslation, getSubdomainUrl } from "../hooks/useTranslation";

const MapPreviewComponent = dynamic<any>(() => import("../MapPreviewComponent"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        width: "100%",
        height: 380,
        background: "var(--surface)",
        borderRadius: "14px",
        display: "grid",
        placeItems: "center",
        color: "var(--text-tertiary)",
        border: "1px solid var(--line)",
      }}
    >
      Carregando mapa interativo...
    </div>
  ),
});

interface QuickVerifyViewProps {
  userName?: string;
  userRole?: string;
  onLogout: () => void;
  onOpenApp?: () => void;
  onOpenDashboard?: () => void;
  onOpenContracts?: () => void;
  onOpenLanding?: () => void;
}

export function QuickVerifyView({
  userName,
  userRole,
  onLogout,
  onOpenApp,
  onOpenDashboard,
  onOpenContracts,
  onOpenLanding,
}: QuickVerifyViewProps) {
  const { locale, t } = useTranslation();
  const [geometry, setGeometry] = useState<GeometryData | null>(null);
  const [fileName, setFileName] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isLoadingCheck, setIsLoadingCheck] = useState(false);
  const [checkResult, setCheckResult] = useState<MapbiomasCheck | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [copiedCoords, setCopiedCoords] = useState(false);
  const [showApiModal, setShowApiModal] = useState(false);
  const [copiedPlatformName, setCopiedPlatformName] = useState<string | null>(null);

  // Calcula área em hectares
  const area = useMemo(() => {
    return geometry ? calculateAreaHectares(geometry) : 0;
  }, [geometry]);

  // Validação topológica do polígono
  const topology = useMemo(() => {
    return geometry ? validatePolygonTopology(geometry) : null;
  }, [geometry]);

  // Centróide
  const centerCoord = useMemo(() => {
    if (!geometry) return null;
    const points = geometry.polygons.flat(2);
    if (!points.length) return null;
    const xs = points.map((p) => p[0]);
    const ys = points.map((p) => p[1]);
    return {
      lng: (Math.min(...xs) + Math.max(...xs)) / 2,
      lat: (Math.min(...ys) + Math.max(...ys)) / 2,
    };
  }, [geometry]);

  // Total de vértices
  const totalVertices = useMemo(() => {
    if (!geometry) return 0;
    return geometry.polygons.reduce((acc, poly) => acc + poly.reduce((rAcc, r) => rAcc + r.length, 0), 0);
  }, [geometry]);

  // Executa checagem multi-plataforma
  const runDeforestationCheck = useCallback(async (geoData: GeometryData) => {
    setIsLoadingCheck(true);
    setErrorMessage("");
    try {
      const res = await fetch("/api/mapbiomas/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          geometry: geoData,
          details: {
            plotId: "VERIFY-KML",
            supplier: "Verificação Rápida",
            municipality: "Consulta Direta",
            state: "BR",
            mappedBy: userName || "Operador FAF",
          },
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Erro ao consultar bases de desmatamento.");
      }

      const data = await res.json();
      const hasChanges = Boolean(data.hasChanges || (data.changes && data.changes.length > 0));

      setCheckResult({
        status: hasChanges ? "attention" : "clear",
        areaHa: data.areaHa || calculateAreaHectares(geoData),
        checkedAt: data.checkedAt || new Date().toISOString(),
        message: hasChanges
          ? "Alerta: Identificada supressão florestal pós-2020 ou alteração de cobertura."
          : "100% Conforme EUDR: Nenhum indício de desmatamento detectado após 31/12/2020.",
        verificationUrl: data.verificationUrl || "",
        mapbiomasUrl: data.mapbiomasUrl,
        mapbiomasAlertaUrl: data.mapbiomasAlertaUrl,
        gfwUrl: data.gfwUrl,
        eufoUrl: data.eufoUrl,
        inpeUrl: data.inpeUrl,
        sicarUrl: data.sicarUrl,
        ibamaUrl: data.ibamaUrl,
        changes: data.changes || [],
      });
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Falha na verificação de satélite.");
      setCheckResult({
        status: "error",
        areaHa: calculateAreaHectares(geoData),
        checkedAt: new Date().toISOString(),
        message: "Não foi possível concluir a verificação remota com os servidores de satélite.",
        verificationUrl: "",
        changes: [],
      });
    } finally {
      setIsLoadingCheck(false);
    }
  }, [userName]);

  // Processa arquivo importado
  const handleFileProcess = useCallback(async (file: File) => {
    setErrorMessage("");
    setCheckResult(null);
    try {
      const parsed = await parseGeometryFile(file);
      setGeometry(parsed);
      setFileName(file.name);
      runDeforestationCheck(parsed);
    } catch (err) {
      setGeometry(null);
      setFileName("");
      setErrorMessage(err instanceof Error ? err.message : "Não foi possível processar o arquivo.");
    }
  }, [runDeforestationCheck]);

  const onFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileProcess(file);
  };

  const onDragOverHandler = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeaveHandler = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDropHandler = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileProcess(file);
  };

  const handleCopyCoords = (platformName?: string) => {
    if (!centerCoord) return;
    const text = `${centerCoord.lat.toFixed(6)}, ${centerCoord.lng.toFixed(6)}`;
    navigator.clipboard.writeText(text);
    if (platformName) {
      setCopiedPlatformName(platformName);
      setTimeout(() => setCopiedPlatformName(null), 2000);
    } else {
      setCopiedCoords(true);
      setTimeout(() => setCopiedCoords(false), 2000);
    }
  };

  const handleDownloadGeoJson = () => {
    if (!geometry) return;
    const geoJson = buildEudrGeoJson(geometry, "VERIFICADO-EUDR", area);
    const blob = new Blob([JSON.stringify(geoJson, null, 2)], { type: "application/geo+json" });
    downloadBlob(`${fileName ? fileName.replace(/\.[^/.]+$/, "") : "talhao"}-eudr.geojson`, blob);
  };

  const handleReset = () => {
    setGeometry(null);
    setFileName("");
    setCheckResult(null);
    setErrorMessage("");
  };

  const centroidLat = centerCoord?.lat?.toFixed(6) || "0";
  const centroidLng = centerCoord?.lng?.toFixed(6) || "0";

  const platforms = [
    {
      name: "MapBiomas Cobertura",
      icon: "🛰️",
      mainUrl:
        checkResult?.mapbiomasUrl ||
        checkResult?.verificationUrl ||
        `https://plataforma.brasil.mapbiomas.org/?theme=coverage_lclu#${centroidLat},${centroidLng},14`,
      mainLabel: "Abrir Mapa com Coordenadas ↗",
      desc: "Série histórica 1985–2024 de uso e cobertura com centróide localizado",
      apiName: "MapBiomas API",
      apiStatus: "Disponível (Token via contato)",
      apiHowTo: "Cadastre-se na plataforma MapBiomas ou solicite token para API de Estatísticas em contato@mapbiomas.org.",
    },
    {
      name: "Global Forest Watch (GFW)",
      icon: "🌲",
      mainUrl:
        checkResult?.gfwUrl ||
        `https://www.globalforestwatch.org/map/?map=center,lat:${centroidLat},lng:${centroidLng},zoom:14`,
      mainLabel: "Abrir no GFW com Zoom Exato ↗",
      desc: "Monitoramento global de perda de cobertura arbórea com coordenadas aplicadas",
      apiName: "GFW Data API",
      apiStatus: "Chave Gratuita Imediata",
      apiHowTo: "Crie conta gratuita em globalforestwatch.org/my-gfw e gere sua API Key no menu Developer API.",
    },
    {
      name: "EU Forest Observatory (EUFO)",
      icon: "🇪🇺",
      mainUrl: "https://forest-observatory.ec.europa.eu/forest/rmap",
      mainLabel: "Abrir Mapa Interativo Global (GFC 2020) ↗",
      desc: "Base oficial da Comissão Europeia para o marco temporal EUDR (31/12/2020)",
      apiName: "JRC WMS & Earth Engine",
      apiStatus: "Acesso Público Aberto",
      apiHowTo: "Acesse via WMS (https://ies-ows.jrc.ec.europa.eu/iforce/gfc2020/wms.py?) ou Google Earth Engine (JRC/GFC2020/V1).",
    },
    {
      name: "TerraBrasilis / INPE",
      icon: "🇧🇷",
      mainUrl: "https://terrabrasilis.dpi.inpe.br/app/map/deforestation",
      mainLabel: "Abrir Mapa de Desmatamento (DETER/PRODES) ↗",
      desc: "Alertas DETER e taxas oficiais do PRODES do Governo Federal",
      apiName: "GeoServer OGC WMS/WFS",
      apiStatus: "API 100% Pública e Gratuita",
      apiHowTo: "Consuma camadas WMS em https://terrabrasilis.dpi.inpe.br/geoserver/ows ou via REST API em terrabrasilis.dpi.inpe.br/api/v1/.",
    },
    {
      name: "SICAR - Cadastro Rural",
      icon: "📋",
      mainUrl: "https://consulta.car.gov.br/",
      mainLabel: "Abrir Mapa Interativo de Imóveis ↗",
      secondaryUrl: "https://consultapublica.car.gov.br/publico/imoveis/index",
      secondaryLabel: "Consulta Textual ↗",
      desc: "Consulta pública espacial dos imóveis rurais e reservas ambientais",
      apiName: "API SICAR (ConectaGov/Serpro)",
      apiStatus: "Requer Credenciamento Federal",
      apiHowTo: "Disponível no catálogo de APIs do Governo Federal (apigateway.conectagov.estaleiro.serpro.gov.br) para entes públicos e empresas.",
    },
    {
      name: "IBAMA Embargos",
      icon: "⚖️",
      mainUrl: "https://pam.ibama.gov.br/",
      mainLabel: "Abrir Painel Interativo de Embargos ↗",
      secondaryUrl: "https://servicos.ibama.gov.br/ctf/publico/areasembargadas/ConsultaPublicaAreasEmbargadas.php",
      secondaryLabel: "Formulário de Embargos ↗",
      desc: "Painel espacial e consulta de autuações e embargos ambientais",
      apiName: "Dados Abertos / Shapefiles IBAMA",
      apiStatus: "Acesso Público Aberto",
      apiHowTo: "Download direto de camadas e polígonos de embargos em dadosabertos.ibama.gov.br e pam.ibama.gov.br sem necessidade de chave.",
    },
    {
      name: "MapBiomas Alerta",
      icon: "🚨",
      mainUrl: "https://alerta.mapbiomas.org/",
      mainLabel: "Abrir Portal de Alertas Validados ↗",
      desc: "Laudos técnicos de desmatamento validados com imagens de alta resolução",
      apiName: "API MapBiomas Alerta",
      apiStatus: "Disponível para parceiros",
      apiHowTo: "Consulte o catálogo de alertas e laudos com integração via API REST mediante convênio técnico institucional.",
    },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-canvas)", color: "var(--text-primary)" }}>
      {/* Topbar Específica do Verificador */}
      <header
        style={{
          height: "64px",
          padding: "0 28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid var(--line)",
          background: "var(--surface)",
          backdropFilter: "blur(8px)",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <a
            href={getSubdomainUrl("https://fafeu.online", locale)}
            onClick={(e) => {
              if (onOpenLanding) {
                e.preventDefault();
                onOpenLanding();
              }
            }}
            style={{ display: "flex", alignItems: "center", gap: "12px", textDecoration: "none", color: "inherit" }}
          >
            <img src="/faf-logo-transparent.png" alt="FAF Coffees" style={{ height: "30px", width: "auto" }} />
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "14px", fontWeight: 700 }}>FAF EUDR</span>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 650,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  padding: "3px 8px",
                  borderRadius: "999px",
                  background: "rgba(16, 185, 129, 0.12)",
                  color: "#10b981",
                  border: "1px solid rgba(16, 185, 129, 0.3)",
                }}
              >
                Verificador KML
              </span>
            </div>
          </a>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {onOpenApp && (
            <button
              onClick={onOpenApp}
              style={{
                background: "transparent",
                border: "1px solid var(--line-strong)",
                color: "var(--text-secondary)",
                padding: "6px 14px",
                borderRadius: "8px",
                fontSize: "12.5px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              Abrir Preparador Completo ➔
            </button>
          )}

          {onOpenDashboard && (
            <button
              onClick={onOpenDashboard}
              style={{
                background: "transparent",
                border: "1px solid var(--line-strong)",
                color: "var(--text-secondary)",
                padding: "6px 14px",
                borderRadius: "8px",
                fontSize: "12.5px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Dashboard
            </button>
          )}

          <button
            onClick={() => setShowApiModal(true)}
            style={{
              background: "rgba(3, 105, 161, 0.1)",
              border: "1px solid rgba(3, 105, 161, 0.3)",
              color: "#0284c7",
              padding: "6px 12px",
              borderRadius: "8px",
              fontSize: "12px",
              fontWeight: 650,
              cursor: "pointer",
            }}
          >
            🔑 Como Obter APIs
          </button>

          <LanguageToggle />
          <ThemeToggle />

          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginLeft: "6px" }}>
            <span style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>
              {userName || "Operador"} ({userRole === "admin" ? "Admin" : "Operador"})
            </span>
            <button
              onClick={onLogout}
              style={{
                background: "rgba(239, 68, 68, 0.08)",
                border: "1px solid rgba(239, 68, 68, 0.25)",
                color: "#ef4444",
                padding: "5px 12px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: "1160px", margin: "0 auto", padding: "36px 24px" }}>
        {/* Banner de Apresentação */}
        <section style={{ textAlign: "center", marginBottom: "32px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: 800, margin: "0 0 8px 0", letterSpacing: "-0.02em" }}>
            Verificação Instantânea de KML
          </h1>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)", maxWidth: "680px", margin: "0 auto" }}>
            Arraste seu arquivo de coordenadas (KML ou GeoJSON). O sistema calcula a área, valida a consistência
            topológica e audita a conformidade com o marco temporal EUDR (31/12/2020) sem necessidade de formulários.
          </p>
        </section>

        {/* Zona de Dropzone (Upload) */}
        {!geometry ? (
          <div
            onDragOver={onDragOverHandler}
            onDragLeave={onDragLeaveHandler}
            onDrop={onDropHandler}
            style={{
              background: isDragging ? "rgba(16, 185, 129, 0.08)" : "var(--surface)",
              border: isDragging ? "2px dashed #10b981" : "2px dashed var(--line-strong)",
              borderRadius: "20px",
              padding: "64px 32px",
              textAlign: "center",
              cursor: "pointer",
              transition: "all 0.2s ease",
              boxShadow: "var(--shadow-card)",
              position: "relative",
            }}
          >
            <input
              type="file"
              accept=".kml,.geojson,.json"
              onChange={onFileInputChange}
              style={{
                position: "absolute",
                inset: 0,
                opacity: 0,
                cursor: "pointer",
                width: "100%",
                height: "100%",
              }}
            />
            <div
              style={{
                width: "68px",
                height: "68px",
                borderRadius: "50%",
                background: "rgba(16, 185, 129, 0.12)",
                color: "#10b981",
                display: "grid",
                placeItems: "center",
                fontSize: "32px",
                margin: "0 auto 20px auto",
              }}
            >
              📥
            </div>
            <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 8px 0" }}>
              Solte o arquivo KML aqui para verificar
            </h2>
            <p style={{ fontSize: "13.5px", color: "var(--text-secondary)", margin: "0 0 20px 0" }}>
              Suporta arquivos <strong>.kml</strong>, <strong>.geojson</strong> ou <strong>.json</strong> (WGS84)
            </p>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 24px",
                borderRadius: "999px",
                background: "var(--brand-crimson)",
                color: "#ffffff",
                fontSize: "13px",
                fontWeight: 650,
                pointerEvents: "none",
              }}
            >
              Selecionar arquivo do computador
            </div>

            {errorMessage && (
              <div
                style={{
                  marginTop: "24px",
                  padding: "12px 20px",
                  borderRadius: "10px",
                  background: "rgba(239, 68, 68, 0.1)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  color: "#ef4444",
                  fontSize: "13px",
                  display: "inline-block",
                }}
              >
                ⚠️ {errorMessage}
              </div>
            )}
          </div>
        ) : (
          /* Visualização de Resultados */
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Header do Arquivo Carregado */}
            <div
              style={{
                background: "var(--surface)",
                border: "1px solid var(--line)",
                borderRadius: "16px",
                padding: "20px 28px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "16px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "12px",
                    background: "rgba(16, 185, 129, 0.1)",
                    display: "grid",
                    placeItems: "center",
                    fontSize: "24px",
                  }}
                >
                  🗺️
                </div>
                <div>
                  <h3 style={{ fontSize: "17px", fontWeight: 700, margin: 0 }}>{fileName}</h3>
                  <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", margin: "4px 0 0 0" }}>
                    {geometry.polygons.length} polígono(s) • {totalVertices} vértices • Topologia:{" "}
                    {topology?.valid ? (
                      <span style={{ color: "#10b981", fontWeight: 600 }}>Válida (Sem auto-interseção)</span>
                    ) : (
                      <span style={{ color: "#ef4444", fontWeight: 600 }}>{topology?.errors?.[0] || "Erro topológico"}</span>
                    )}
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <button
                  onClick={handleDownloadGeoJson}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "8px",
                    background: "var(--surface-raised, #f3f4f6)",
                    border: "1px solid var(--line-strong)",
                    color: "var(--text-primary)",
                    fontSize: "12.5px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Exportar GeoJSON
                </button>
                <button
                  onClick={handleReset}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "8px",
                    background: "rgba(239, 68, 68, 0.1)",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    color: "#ef4444",
                    fontSize: "12.5px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Verificar Outro KML
                </button>
              </div>
            </div>

            {/* Grid com Métricas Rápidas */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "16px",
              }}
            >
              <div
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--line)",
                  borderRadius: "14px",
                  padding: "18px 20px",
                }}
              >
                <span style={{ fontSize: "12px", color: "var(--text-tertiary)", fontWeight: 600 }}>ÁREA MEDIDA</span>
                <div style={{ fontSize: "24px", fontWeight: 800, marginTop: "6px", color: "#10b981" }}>
                  {area.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ha
                </div>
                <span style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>Cálculo geodésico WGS84</span>
              </div>

              <div
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--line)",
                  borderRadius: "14px",
                  padding: "18px 20px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "12px", color: "var(--text-tertiary)", fontWeight: 600 }}>
                    COORDENADA CENTRÓIDE
                  </span>
                  {centerCoord && (
                    <button
                      onClick={handleCopyCoords}
                      style={{
                        background: "none",
                        border: "none",
                        color: copiedCoords ? "#10b981" : "var(--brand-crimson)",
                        fontSize: "11px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      {copiedCoords ? "Copiado!" : "Copiar"}
                    </button>
                  )}
                </div>
                <div style={{ fontSize: "16px", fontWeight: 700, marginTop: "10px" }}>
                  {centerCoord ? `${centerCoord.lat.toFixed(6)}, ${centerCoord.lng.toFixed(6)}` : "—"}
                </div>
                <span style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>Ponto focal para auditoria</span>
              </div>

              <div
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--line)",
                  borderRadius: "14px",
                  padding: "18px 20px",
                }}
              >
                <span style={{ fontSize: "12px", color: "var(--text-tertiary)", fontWeight: 600 }}>
                  MARCO TEMPORAL EUDR
                </span>
                <div style={{ fontSize: "20px", fontWeight: 700, marginTop: "8px" }}>31 / 12 / 2020</div>
                <span style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>Data de corte regulatório</span>
              </div>

              <div
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--line)",
                  borderRadius: "14px",
                  padding: "18px 20px",
                }}
              >
                <span style={{ fontSize: "12px", color: "var(--text-tertiary)", fontWeight: 600 }}>STATUS EUDR</span>
                <div style={{ marginTop: "8px" }}>
                  {isLoadingCheck ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#0284c7" }}>
                      <span className="spinner" style={{ width: "14px", height: "14px" }} />
                      <span style={{ fontSize: "14px", fontWeight: 700 }}>Consultando satélites...</span>
                    </div>
                  ) : checkResult?.status === "clear" ? (
                    <span style={{ color: "#10b981", fontSize: "15px", fontWeight: 800, display: "flex", alignItems: "center", gap: "6px" }}>
                      ✅ Conforme EUDR
                    </span>
                  ) : checkResult?.status === "attention" ? (
                    <span style={{ color: "#f59e0b", fontSize: "15px", fontWeight: 800, display: "flex", alignItems: "center", gap: "6px" }}>
                      ⚠️ Alerta Detectado
                    </span>
                  ) : (
                    <span style={{ color: "#ef4444", fontSize: "14px", fontWeight: 700 }}>Erro na consulta</span>
                  )}
                </div>
                <span style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>
                  {checkResult ? `Auditado em ${new Date(checkResult.checkedAt).toLocaleDateString("pt-BR")}` : "Aguardando retorno"}
                </span>
              </div>
            </div>

            {/* Banner de Resultado de Auditoria */}
            {checkResult && (
              <div
                style={{
                  padding: "20px 24px",
                  borderRadius: "14px",
                  border:
                    checkResult.status === "clear"
                      ? "1px solid rgba(16, 185, 129, 0.4)"
                      : checkResult.status === "attention"
                      ? "1px solid rgba(245, 158, 11, 0.4)"
                      : "1px solid rgba(239, 68, 68, 0.4)",
                  background:
                    checkResult.status === "clear"
                      ? "rgba(16, 185, 129, 0.08)"
                      : checkResult.status === "attention"
                      ? "rgba(245, 158, 11, 0.08)"
                      : "rgba(239, 68, 68, 0.08)",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "14px",
                }}
              >
                <span style={{ fontSize: "24px", lineHeight: 1 }}>
                  {checkResult.status === "clear" ? "🛡️" : checkResult.status === "attention" ? "⚠️" : "❌"}
                </span>
                <div style={{ flex: 1 }}>
                  <h4
                    style={{
                      fontSize: "16px",
                      fontWeight: 700,
                      margin: "0 0 4px 0",
                      color:
                        checkResult.status === "clear"
                          ? "#10b981"
                          : checkResult.status === "attention"
                          ? "#f59e0b"
                          : "#ef4444",
                    }}
                  >
                    {checkResult.status === "clear"
                      ? "Área Sem Desmatamento Após 31/12/2020"
                      : checkResult.status === "attention"
                      ? "Alerta de Supressão / Mudança de Cobertura"
                      : "Erro na Checagem Remota"}
                  </h4>
                  <p style={{ fontSize: "13px", margin: 0, color: "var(--text-secondary)" }}>
                    {checkResult.message}
                  </p>
                </div>
              </div>
            )}

            {/* Mapa Interativo de Satélite */}
            <div
              style={{
                background: "var(--surface)",
                border: "1px solid var(--line)",
                borderRadius: "16px",
                padding: "20px",
                overflow: "hidden",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                <h4 style={{ fontSize: "15px", fontWeight: 700, margin: 0 }}>
                  Visualização de Satélite do Polígono
                </h4>
                <span style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>
                  Camadas: Imagem de Alta Resolução + Vetor KML
                </span>
              </div>

              <div style={{ borderRadius: "12px", overflow: "hidden", height: "400px" }}>
                <MapPreviewComponent
                  geometry={geometry}
                  plotName={fileName || "Talhão KML"}
                  plotArea={area}
                />
              </div>
            </div>

            {/* Hub de Auditoria Cruzada - 7 Plataformas */}
            <div
              style={{
                background: "var(--surface)",
                border: "1px solid var(--line)",
                borderRadius: "16px",
                padding: "24px",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", marginBottom: "18px" }}>
                <div>
                  <h4 style={{ fontSize: "17px", fontWeight: 700, margin: "0 0 6px 0" }}>
                    Hub de Auditoria Cruzada — 7 Plataformas Oficiais
                  </h4>
                  <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0, maxWidth: "700px" }}>
                    Acesse os mapas interativos e ferramentas de validação espacial com as coordenadas exatas do talhão
                    já pré-configuradas.
                  </p>
                </div>
                <button
                  onClick={() => setShowApiModal(true)}
                  style={{
                    background: "rgba(3, 105, 161, 0.08)",
                    border: "1px solid rgba(3, 105, 161, 0.25)",
                    color: "#0284c7",
                    padding: "8px 16px",
                    borderRadius: "8px",
                    fontSize: "12.5px",
                    fontWeight: 650,
                    cursor: "pointer",
                  }}
                >
                  🔑 Guia de APIs & Conexões
                </button>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                  gap: "14px",
                }}
              >
                {platforms.map((plat) => (
                  <div
                    key={plat.name}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      gap: "12px",
                      padding: "16px 18px",
                      borderRadius: "14px",
                      background: "var(--bg-canvas)",
                      border: "1px solid var(--line)",
                      transition: "border-color 0.15s ease",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                        <span style={{ fontSize: "22px" }}>{plat.icon}</span>
                        <div>
                          <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>
                            {plat.name}
                          </div>
                          <span style={{ fontSize: "11px", color: "#10b981", fontWeight: 600 }}>
                            {plat.apiStatus}
                          </span>
                        </div>
                      </div>
                      <p
                        style={{
                          fontSize: "12px",
                          color: "var(--text-secondary)",
                          margin: "6px 0 0 0",
                          lineHeight: 1.35,
                        }}
                      >
                        {plat.desc}
                      </p>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "8px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <a
                          href={plat.mainUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            flex: 1,
                            textAlign: "center",
                            background: "var(--brand-crimson)",
                            color: "#ffffff",
                            padding: "8px 12px",
                            borderRadius: "8px",
                            fontSize: "12px",
                            fontWeight: 650,
                            textDecoration: "none",
                            display: "block",
                          }}
                        >
                          {plat.mainLabel}
                        </a>

                        <button
                          onClick={() => handleCopyCoords(plat.name)}
                          title="Copiar latitude e longitude para colar na busca do portal"
                          style={{
                            background: "var(--surface)",
                            border: "1px solid var(--line-strong)",
                            color: copiedPlatformName === plat.name ? "#10b981" : "var(--text-secondary)",
                            padding: "8px 12px",
                            borderRadius: "8px",
                            fontSize: "11.5px",
                            fontWeight: 600,
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {copiedPlatformName === plat.name ? "✓ Copiado!" : "📋 Copiar Lat/Lng"}
                        </button>
                      </div>

                      {plat.secondaryUrl && (
                        <a
                          href={plat.secondaryUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            textAlign: "center",
                            color: "var(--text-secondary)",
                            fontSize: "11.5px",
                            padding: "4px 8px",
                            textDecoration: "underline",
                          }}
                        >
                          {plat.secondaryLabel}
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal: Guia Completo de APIs e Integração */}
      {showApiModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.65)",
            backdropFilter: "blur(6px)",
            zIndex: 9999,
            display: "grid",
            placeItems: "center",
            padding: "20px",
          }}
          onClick={() => setShowApiModal(false)}
        >
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--line)",
              borderRadius: "20px",
              padding: "32px",
              maxWidth: "760px",
              width: "100%",
              maxHeight: "85vh",
              overflowY: "auto",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "28px" }}>🔑</span>
                <div>
                  <h3 style={{ fontSize: "19px", fontWeight: 800, margin: 0 }}>
                    Guia de Obtenção de APIs & Acessos
                  </h3>
                  <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", margin: "2px 0 0 0" }}>
                    Como obter chaves, tokens e conectar cada uma das 7 plataformas ao sistema FAF
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowApiModal(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: "22px",
                  cursor: "pointer",
                  color: "var(--text-secondary)",
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {platforms.map((p) => (
                <div
                  key={p.name}
                  style={{
                    padding: "16px",
                    borderRadius: "12px",
                    background: "var(--bg-canvas)",
                    border: "1px solid var(--line)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span>{p.icon}</span>
                      <strong style={{ fontSize: "14px" }}>{p.name}</strong>
                      <span style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>({p.apiName})</span>
                    </div>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 650,
                        padding: "2px 8px",
                        borderRadius: "999px",
                        background: "rgba(16, 185, 129, 0.12)",
                        color: "#10b981",
                        border: "1px solid rgba(16, 185, 129, 0.3)",
                      }}
                    >
                      {p.apiStatus}
                    </span>
                  </div>
                  <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", margin: 0, lineHeight: 1.4 }}>
                    {p.apiHowTo}
                  </p>
                </div>
              ))}
            </div>

            <div style={{ marginTop: "24px", textAlign: "right" }}>
              <button
                onClick={() => setShowApiModal(false)}
                style={{
                  background: "var(--brand-crimson)",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "10px 22px",
                  fontSize: "13px",
                  fontWeight: 650,
                  cursor: "pointer",
                }}
              >
                Entendido, Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
