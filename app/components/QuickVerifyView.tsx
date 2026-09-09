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
  const [filterCategory, setFilterCategory] = useState<"all" | "direct" | "portal">("all");
  const [downloadFeedback, setDownloadFeedback] = useState<string | null>(null);

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
        sentinelUrl: data.sentinelUrl,
        googleMapsUrl: data.googleMapsUrl,
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

  const handleCopyCoords = (platformName?: string | React.MouseEvent) => {
    if (!centerCoord) return;
    const text = `${centerCoord.lat.toFixed(6)}, ${centerCoord.lng.toFixed(6)}`;
    navigator.clipboard.writeText(text);
    if (typeof platformName === "string") {
      setCopiedPlatformName(platformName);
      setTimeout(() => setCopiedPlatformName(null), 2000);
    } else {
      setCopiedCoords(true);
      setTimeout(() => setCopiedCoords(false), 2000);
    }
  };

  const handleDownloadGeoJson = () => {
    if (!geometry) return;
    const baseName = fileName ? fileName.replace(/\.[^/.]+$/, "") : "talhao";
    const geoJson = buildEudrGeoJson(geometry, "VERIFICADO-EUDR", area);
    const blob = new Blob([JSON.stringify(geoJson, null, 2)], { type: "application/geo+json" });
    downloadBlob(`${baseName}-eudr.geojson`, blob);
    setDownloadFeedback("GeoJSON baixado com sucesso!");
    setTimeout(() => setDownloadFeedback(null), 2500);
  };

  const handleDownloadKml = () => {
    if (!geometry) return;
    const baseName = fileName ? fileName.replace(/\.[^/.]+$/, "") : "talhao";
    const placemarks = geometry.polygons
      .map((polygon, i) => {
        const outer = polygon[0].map(([lon, lat]) => `${lon},${lat},0`).join(" ");
        const innerHoles = polygon
          .slice(1)
          .map(
            (ring) => `
          <innerBoundaryIs>
            <LinearRing>
              <coordinates>${ring.map(([lon, lat]) => `${lon},${lat},0`).join(" ")}</coordinates>
            </LinearRing>
          </innerBoundaryIs>`
          )
          .join("");
        return `
    <Placemark>
      <name>${baseName} - Polígono ${i + 1}</name>
      <Polygon>
        <outerBoundaryIs>
          <LinearRing>
            <coordinates>${outer}</coordinates>
          </LinearRing>
        </outerBoundaryIs>${innerHoles}
      </Polygon>
    </Placemark>`;
      })
      .join("");

    const kmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${baseName}</name>
    <description>Talhão exportado para verificação EUDR (FAF Coffees)</description>
    ${placemarks}
  </Document>
</kml>`;

    const blob = new Blob([kmlContent], { type: "application/vnd.google-earth.kml+xml" });
    downloadBlob(`${baseName}-eudr.kml`, blob);
    setDownloadFeedback("KML baixado com sucesso!");
    setTimeout(() => setDownloadFeedback(null), 2500);
  };

  const handleReset = () => {
    setGeometry(null);
    setFileName("");
    setCheckResult(null);
    setErrorMessage("");
    setDownloadFeedback(null);
  };

  const centroidLat = centerCoord?.lat?.toFixed(6) || "0";
  const centroidLng = centerCoord?.lng?.toFixed(6) || "0";

  const platforms = [
    // 1. Zoom Direto no Talhão (Automático por coordenadas)
    {
      id: "gfw",
      name: "Global Forest Watch (GFW)",
      icon: "🌲",
      category: "direct" as const,
      badgeText: "Zoom Automático no Talhão",
      badgeColor: "#10b981",
      mainUrl:
        checkResult?.gfwUrl ||
        `https://www.globalforestwatch.org/map/?map=center,lat:${centroidLat},lng:${centroidLng},zoom:15`,
      mainLabel: "Abrir no GFW com Zoom Exato ↗",
      desc: "Monitoramento global de cobertura florestal com coordenadas e contorno de satélite aplicados",
      allowDirectDownload: true,
      requiresUploadNote: "",
      apiName: "GFW Data API",
      apiStatus: "Chave Gratuita Imediata",
      apiHowTo: "Crie uma conta gratuita em globalforestwatch.org/my-gfw e gere sua API Key no menu Developer API.",
    },
    {
      id: "sentinel",
      name: "Sentinel Hub EO Browser",
      icon: "🛰️",
      category: "direct" as const,
      badgeText: "Zoom Automático + Marco 2020",
      badgeColor: "#10b981",
      mainUrl:
        checkResult?.sentinelUrl ||
        `https://apps.sentinel-hub.com/eo-browser/?zoom=15&lat=${centroidLat}&lng=${centroidLng}&themeId=DEFAULT-THEME`,
      mainLabel: "Abrir no Sentinel Hub com Zoom Exato ↗",
      desc: "Imagens de satélite Sentinel-2/Landsat no talhão com comparação histórica antes e após 31/12/2020",
      allowDirectDownload: true,
      requiresUploadNote: "",
      apiName: "Copernicus Data Space",
      apiStatus: "Acesso Aberto & APIs REST",
      apiHowTo: "Acesse dataspace.copernicus.eu e cadastre-se para obter credenciais OAuth de consumo automatizado de imagens.",
    },
    {
      id: "google_sat",
      name: "Google Maps Satélite HD",
      icon: "🗺️",
      category: "direct" as const,
      badgeText: "Zoom Automático Satélite",
      badgeColor: "#10b981",
      mainUrl:
        checkResult?.googleMapsUrl ||
        `https://www.google.com/maps/@${centroidLat},${centroidLng},16z/data=!3m1!1e3`,
      mainLabel: "Abrir no Google Satélite com Zoom Exato ↗",
      desc: "Visualização em alta resolução de satélite centralizada no centróide exato do talhão",
      allowDirectDownload: false,
      requiresUploadNote: "",
      apiName: "Google Maps Platform",
      apiStatus: "Disponível",
      apiHowTo: "Ative a API Maps JavaScript ou Static Maps no console Google Cloud (console.cloud.google.com).",
    },

    // 2. Portais Governamentais / Requerem Importação do Arquivo ou Token
    {
      id: "mapbiomas",
      name: "MapBiomas Cobertura",
      icon: "🇧🇷",
      category: "portal" as const,
      badgeText: checkResult?.mapbiomasUrl?.includes("territoryId") ? "Polígono Vinculado via API" : "Requer Importar ou Token API",
      badgeColor: checkResult?.mapbiomasUrl?.includes("territoryId") ? "#10b981" : "#f59e0b",
      mainUrl:
        checkResult?.mapbiomasUrl ||
        checkResult?.verificationUrl ||
        `https://plataforma.brasil.mapbiomas.org/?theme=coverage_lclu`,
      mainLabel: "Abrir Portal MapBiomas ↗",
      desc: "Série temporal oficial 1985–2024 de uso e cobertura do solo do Brasil",
      requiresUploadNote: "O portal web abre na visão do Brasil. Baixe o GeoJSON ou KML abaixo e clique em 'Importar Território' no MapBiomas (ou configure MAPBIOMAS_TOKEN na API para abrir com zoom direto).",
      allowDirectDownload: true,
      apiName: "MapBiomas API",
      apiStatus: "Token Institucional Gratuito",
      apiHowTo: "Solicite o token da API de Estatísticas/Upload de Territórios pelo e-mail contato@mapbiomas.org e configure a variável MAPBIOMAS_TOKEN nas configurações do sistema.",
    },
    {
      id: "eufo",
      name: "EU Forest Observatory (EUFO)",
      icon: "🇪🇺",
      category: "portal" as const,
      badgeText: "Importar AOI no Portal",
      badgeColor: "#0284c7",
      mainUrl: "https://forest-observatory.ec.europa.eu/forest/rmap",
      mainLabel: "Abrir Mapa EUFO (GFC 2020) ↗",
      desc: "Base oficial da Comissão Europeia para auditoria do marco temporal EUDR (31/12/2020)",
      requiresUploadNote: "O portal da Comissão Europeia não aceita zoom por URL. Baixe o GeoJSON ou KML abaixo e utilize a ferramenta 'Upload AOI' no mapa do portal.",
      allowDirectDownload: true,
      apiName: "JRC WMS & Earth Engine",
      apiStatus: "100% Público e Gratuito",
      apiHowTo: "Consuma as camadas raster WMS via https://ies-ows.jrc.ec.europa.eu/iforce/gfc2020/wms.py? ou Google Earth Engine (JRC/GFC2020/V1).",
    },
    {
      id: "terrabrasilis",
      name: "TerraBrasilis / INPE",
      icon: "🛰️",
      category: "portal" as const,
      badgeText: "Importar Camada no Portal",
      badgeColor: "#0284c7",
      mainUrl: "https://terrabrasilis.dpi.inpe.br/app/map/deforestation",
      mainLabel: "Abrir TerraBrasilis (DETER/PRODES) ↗",
      desc: "Alertas DETER e taxas de desmatamento PRODES do Instituto Nacional de Pesquisas Espaciais (INPE)",
      requiresUploadNote: "O visualizador do INPE não aceita coordenadas na barra de endereço. Baixe o GeoJSON ou KML abaixo e importe na aba de camadas do portal.",
      allowDirectDownload: true,
      apiName: "GeoServer OGC WMS/WFS",
      apiStatus: "API Pública e Gratuita",
      apiHowTo: "Conecte camadas WMS diretamente via https://terrabrasilis.dpi.inpe.br/geoserver/ows ou consuma a REST API em terrabrasilis.dpi.inpe.br/api/v1/.",
    },
    {
      id: "sicar",
      name: "SICAR - Cadastro Rural",
      icon: "📋",
      category: "portal" as const,
      badgeText: "Consulta Pública CAR",
      badgeColor: "#64748b",
      mainUrl: "https://consulta.car.gov.br/",
      mainLabel: "Abrir Mapa de Imóveis do CAR ↗",
      secondaryUrl: "https://consultapublica.car.gov.br/publico/imoveis/index",
      secondaryLabel: "Consulta Textual por Município ↗",
      desc: "Base pública dos limites de imóveis rurais e reservas ambientais do Brasil",
      requiresUploadNote: "Use as coordenadas copiadas ou o código do CAR para pesquisar e localizar a propriedade no mapa oficial do Governo Federal.",
      allowDirectDownload: true,
      apiName: "API SICAR (ConectaGov/Serpro)",
      apiStatus: "Credenciamento Federal",
      apiHowTo: "Disponível no catálogo do Governo Federal (apigateway.conectagov.estaleiro.serpro.gov.br) para entes públicos e empresas autorizadas.",
    },
    {
      id: "ibama",
      name: "IBAMA Embargos",
      icon: "⚖️",
      category: "portal" as const,
      badgeText: "Painel Espacial IBAMA",
      badgeColor: "#64748b",
      mainUrl: "https://pam.ibama.gov.br/",
      mainLabel: "Abrir Painel Espacial IBAMA ↗",
      secondaryUrl: "https://servicos.ibama.gov.br/ctf/publico/areasembargadas/ConsultaPublicaAreasEmbargadas.php",
      secondaryLabel: "Formulário de Certidões ↗",
      desc: "Painel espacial de autuações e polígonos embargados pelo IBAMA",
      requiresUploadNote: "Verifique se o centróide ou polígono intercepta áreas com embargo ambiental emitido pelo órgão fiscalizador.",
      allowDirectDownload: false,
      apiName: "Dados Abertos / Shapefiles IBAMA",
      apiStatus: "Download Público Aberto",
      apiHowTo: "Download direto de shapefiles de embargos em dadosabertos.ibama.gov.br e pam.ibama.gov.br sem necessidade de chave.",
    },
    {
      id: "mapbiomas_alerta",
      name: "MapBiomas Alerta",
      icon: "🚨",
      category: "portal" as const,
      badgeText: "Laudos com Satélite Planet",
      badgeColor: "#f59e0b",
      mainUrl: "https://alerta.mapbiomas.org/",
      mainLabel: "Abrir Portal de Alertas ↗",
      desc: "Laudos técnicos de desmatamento validados com imagens de alta resolução (3m) do satélite Planet",
      requiresUploadNote: "Faça upload do arquivo do talhão na consulta espacial do MapBiomas Alerta para cruzar com o histórico de alertas validados.",
      allowDirectDownload: true,
      apiName: "API MapBiomas Alerta",
      apiStatus: "Parceria Institucional",
      apiHowTo: "Integração direta de laudos e alertas via API REST mediante termo de cooperação institucional.",
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
                      onClick={() => handleCopyCoords()}
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

            {/* Hub de Auditoria Cruzada - 9 Plataformas */}
            <div
              style={{
                background: "var(--surface)",
                border: "1px solid var(--line)",
                borderRadius: "16px",
                padding: "24px",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <h4 style={{ fontSize: "17px", fontWeight: 700, margin: 0 }}>
                      Hub de Auditoria Cruzada — 9 Plataformas Oficiais
                    </h4>
                    {downloadFeedback && (
                      <span
                        style={{
                          fontSize: "11.5px",
                          fontWeight: 700,
                          color: "#10b981",
                          background: "rgba(16, 185, 129, 0.12)",
                          border: "1px solid rgba(16, 185, 129, 0.3)",
                          padding: "2px 8px",
                          borderRadius: "6px",
                        }}
                      >
                        ✓ {downloadFeedback}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "4px 0 0 0", maxWidth: "720px" }}>
                    Valide a conformidade do talhão em múltiplos satélites e portais oficiais com coordenadas, links diretos e arquivos prontos para importação.
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

              {/* Banner Didático de Explicação de Portais Governamentais */}
              <div
                style={{
                  background: "rgba(2, 132, 199, 0.06)",
                  border: "1px solid rgba(2, 132, 199, 0.2)",
                  borderRadius: "12px",
                  padding: "12px 16px",
                  marginBottom: "18px",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                }}
              >
                <span style={{ fontSize: "18px", lineHeight: 1 }}>💡</span>
                <div style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.45 }}>
                  <strong style={{ color: "var(--text-primary)" }}>Como funcionam os acessos às plataformas:</strong>
                  <br />
                  Plataformas como <strong>Global Forest Watch</strong>, <strong>Sentinel Hub</strong> e <strong>Google Satélite</strong> abrem com <strong>zoom direto no seu talhão</strong>.
                  Já portais governamentais como <strong>MapBiomas</strong>, <strong>Forest EU</strong> e <strong>TerraBrasilis</strong> não leem coordenadas na URL; para consultá-los, clique no botão <strong>"📥 Baixar GeoJSON"</strong> ou <strong>"📥 Baixar KML"</strong> no card da plataforma e carregue o arquivo no mapa do portal (Upload AOI / Importar Camada).
                </div>
              </div>

              {/* Filtros de Categoria */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-tertiary)", marginRight: "4px" }}>
                  FILTRAR:
                </span>
                <button
                  onClick={() => setFilterCategory("all")}
                  style={{
                    background: filterCategory === "all" ? "var(--brand-crimson)" : "var(--bg-canvas)",
                    color: filterCategory === "all" ? "#ffffff" : "var(--text-secondary)",
                    border: "1px solid var(--line)",
                    borderRadius: "8px",
                    padding: "6px 12px",
                    fontSize: "12px",
                    fontWeight: 650,
                    cursor: "pointer",
                  }}
                >
                  🌐 Todas ({platforms.length})
                </button>
                <button
                  onClick={() => setFilterCategory("direct")}
                  style={{
                    background: filterCategory === "direct" ? "#10b981" : "var(--bg-canvas)",
                    color: filterCategory === "direct" ? "#ffffff" : "var(--text-secondary)",
                    border: "1px solid var(--line)",
                    borderRadius: "8px",
                    padding: "6px 12px",
                    fontSize: "12px",
                    fontWeight: 650,
                    cursor: "pointer",
                  }}
                >
                  🚀 Zoom Direto no Talhão ({platforms.filter((p) => p.category === "direct").length})
                </button>
                <button
                  onClick={() => setFilterCategory("portal")}
                  style={{
                    background: filterCategory === "portal" ? "#0284c7" : "var(--bg-canvas)",
                    color: filterCategory === "portal" ? "#ffffff" : "var(--text-secondary)",
                    border: "1px solid var(--line)",
                    borderRadius: "8px",
                    padding: "6px 12px",
                    fontSize: "12px",
                    fontWeight: 650,
                    cursor: "pointer",
                  }}
                >
                  🏛️ Portais Oficiais & Governamentais ({platforms.filter((p) => p.category === "portal").length})
                </button>
              </div>

              {/* Grade de Cards das Plataformas */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                  gap: "14px",
                }}
              >
                {platforms
                  .filter((plat) => filterCategory === "all" || plat.category === filterCategory)
                  .map((plat) => (
                    <div
                      key={plat.id}
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
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", marginBottom: "6px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <span style={{ fontSize: "22px" }}>{plat.icon}</span>
                            <div>
                              <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>
                                {plat.name}
                              </div>
                              <span style={{ fontSize: "11px", color: plat.badgeColor, fontWeight: 650 }}>
                                {plat.badgeText}
                              </span>
                            </div>
                          </div>
                          <span
                            style={{
                              fontSize: "10px",
                              fontWeight: 700,
                              textTransform: "uppercase",
                              letterSpacing: "0.04em",
                              padding: "2px 6px",
                              borderRadius: "4px",
                              background: plat.category === "direct" ? "rgba(16, 185, 129, 0.1)" : "rgba(2, 132, 199, 0.1)",
                              color: plat.category === "direct" ? "#10b981" : "#0284c7",
                            }}
                          >
                            {plat.category === "direct" ? "Zoom Direto" : "Portal Oficial"}
                          </span>
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

                      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
                        {/* Botão de Acesso Principal e Copiar Coordenadas */}
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <a
                            href={plat.mainUrl}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              flex: 1,
                              textAlign: "center",
                              background: plat.category === "direct" ? "var(--brand-crimson)" : "#0284c7",
                              color: "#ffffff",
                              padding: "8px 12px",
                              borderRadius: "8px",
                              fontSize: "12px",
                              fontWeight: 700,
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
                            {copiedPlatformName === plat.name ? "✓ Copiado!" : "📋 Lat/Lng"}
                          </button>
                        </div>

                        {/* Ações de Download 1-Clique do Arquivo para Importação no Portal */}
                        {plat.allowDirectDownload && (
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <button
                              onClick={handleDownloadGeoJson}
                              title="Baixar arquivo GeoJSON para importar neste portal"
                              style={{
                                flex: 1,
                                background: "rgba(2, 132, 199, 0.08)",
                                border: "1px solid rgba(2, 132, 199, 0.25)",
                                color: "#0284c7",
                                padding: "6px 8px",
                                borderRadius: "6px",
                                fontSize: "11px",
                                fontWeight: 650,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "4px",
                              }}
                            >
                              📥 Baixar GeoJSON
                            </button>

                            <button
                              onClick={handleDownloadKml}
                              title="Baixar arquivo KML para importar neste portal"
                              style={{
                                flex: 1,
                                background: "rgba(16, 185, 129, 0.08)",
                                border: "1px solid rgba(16, 185, 129, 0.25)",
                                color: "#10b981",
                                padding: "6px 8px",
                                borderRadius: "6px",
                                fontSize: "11px",
                                fontWeight: 650,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "4px",
                              }}
                            >
                              📥 Baixar KML
                            </button>
                          </div>
                        )}

                        {/* Nota Explicativa para Portais que requerem upload */}
                        {plat.requiresUploadNote && (
                          <div
                            style={{
                              background: "rgba(245, 158, 11, 0.07)",
                              border: "1px solid rgba(245, 158, 11, 0.22)",
                              borderRadius: "8px",
                              padding: "8px 10px",
                              fontSize: "11px",
                              color: "var(--text-secondary)",
                              lineHeight: 1.35,
                              display: "flex",
                              alignItems: "flex-start",
                              gap: "6px",
                            }}
                          >
                            <span style={{ fontSize: "13px", lineHeight: 1 }}>💡</span>
                            <span>{plat.requiresUploadNote}</span>
                          </div>
                        )}

                        {plat.secondaryUrl && (
                          <a
                            href={plat.secondaryUrl}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              textAlign: "center",
                              color: "var(--text-secondary)",
                              fontSize: "11px",
                              padding: "2px 6px",
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
                    Como obter chaves, tokens e conectar cada uma das 9 plataformas ao sistema FAF
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
