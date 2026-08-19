"use client";

import { useState } from "react";
import {
  GeometryData,
  buildEudrGeoJson,
  buildProducerXlsxBytes,
  buildShapefileParts,
  calculateAreaHectares,
  downloadBlob,
  sanitizePlotId,
  zipStore,
  zipStoreBytes,
} from "../lib/eudr";
import { recordAuditLog } from "../lib/auditLogger";
import type { FormState } from "../lib/types";

export type ExportStep = "idle" | "geojson" | "shapefile" | "excel" | "zip" | "r2_upload" | "done" | "error";

export function usePackageExporter(
  form: FormState,
  geometry: GeometryData | null,
  loggedUserKey: string,
  onShowToast?: (type: "success" | "error" | "info", message: string) => void
) {
  const [exporting, setExporting] = useState(false);
  const [exportStep, setExportStep] = useState<ExportStep>("idle");
  const [exportStepMessage, setExportStepMessage] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);
  const [r2Publishing, setR2Publishing] = useState(false);
  const [r2Success, setR2Success] = useState(false);

  const getSafeBaseName = () => {
    const cleanId = sanitizePlotId(form.plotId) || "TALHAO";
    return cleanId.replace(/[^a-zA-Z0-9_-]/g, "_");
  };

  const generateFullZipPackage = async (): Promise<{ zipBlob: Blob; geoJsonStr: string; baseName: string }> => {
    if (!geometry) throw new Error("Geometria não informada.");
    const baseName = getSafeBaseName();
    const area = calculateAreaHectares(geometry);

    // 1. GeoJSON
    setExportStep("geojson");
    setExportStepMessage("1/4: Gerando WGS84 GeoJSON homologado...");
    const geoJsonObj = buildEudrGeoJson(geometry, baseName, area);
    const geoJsonStr = JSON.stringify(geoJsonObj, null, 2);
    const geojsonBytes = new TextEncoder().encode(geoJsonStr);

    // 2. Shapefile (5 parts)
    setExportStep("shapefile");
    setExportStepMessage("2/4: Gerando conjunto ESRI Shapefile (.shp, .shx, .dbf, .prj, .cpg)...");
    const shapeParts = buildShapefileParts(geometry, baseName, area, form);
    const shapefileZipBytes = zipStoreBytes(shapeParts);

    // 3. Producer XLSX
    setExportStep("excel");
    setExportStepMessage("3/4: Gerando planilha oficial do produtor (.xlsx)...");
    const xlsxBytes = buildProducerXlsxBytes({ ...form, plotId: baseName, area });

    // 4. ZIP Package
    setExportStep("zip");
    setExportStepMessage("4/4: Compactando pacote EUDR final...");
    const allFiles = [
      { name: `${baseName}.geojson`, data: geojsonBytes },
      { name: `${baseName}-cadastro.xlsx`, data: xlsxBytes },
      { name: `${baseName}-shapefile.zip`, data: shapefileZipBytes },
    ];

    const zipBlob = zipStore(allFiles);
    return { zipBlob, geoJsonStr, baseName };
  };

  const downloadFullPackage = async () => {
    if (!geometry) return;
    setExporting(true);
    try {
      const { zipBlob, baseName } = await generateFullZipPackage();
      downloadBlob(`${baseName}-pacote-eudr.zip`, zipBlob);
      setExportStep("done");
      setExportStepMessage("Pacote exportado com sucesso!");

      const activeUser = loggedUserKey || "usuario";
      const activeName = form.mappedBy || activeUser;
      recordAuditLog(
        activeUser,
        activeName,
        "PACKAGE_EXPORTED",
        "EXPORTACAO",
        `Baixou o pacote ZIP EUDR completo para o talhão "${baseName}".`,
        baseName
      );
      onShowToast?.("success", `Pacote EUDR ${baseName} baixado com sucesso!`);
    } catch (e: any) {
      setExportStep("error");
      setExportStepMessage(e.message || "Erro ao exportar pacote");
      onShowToast?.("error", e.message || "Erro na exportação");
    } finally {
      setTimeout(() => {
        setExporting(false);
        setExportStep("idle");
      }, 1200);
    }
  };

  const downloadGeoJsonOnly = () => {
    if (!geometry) return;
    const baseName = getSafeBaseName();
    const area = calculateAreaHectares(geometry);
    const geoJsonObj = buildEudrGeoJson(geometry, baseName, area);
    const str = JSON.stringify(geoJsonObj, null, 2);
    downloadBlob(`${baseName}.geojson`, new Blob([str], { type: "application/geo+json" }));

    const activeUser = loggedUserKey || "usuario";
    const activeName = form.mappedBy || activeUser;
    recordAuditLog(
      activeUser,
      activeName,
      "GEOJSON_EXPORTED",
      "EXPORTACAO",
      `Baixou apenas o arquivo GeoJSON para o talhão "${baseName}".`,
      baseName
    );
    onShowToast?.("info", `GeoJSON ${baseName}.geojson baixado.`);
  };

  const handleCopySharepointRow = async () => {
    if (!geometry) return;
    const areaHa = calculateAreaHectares(geometry).toFixed(2);
    const center = (() => {
      const points = geometry.polygons.flat(2);
      if (!points.length) return { lat: "", lng: "" };
      const xs = points.map((p) => p[0]);
      const ys = points.map((p) => p[1]);
      return {
        lat: ((Math.min(...ys) + Math.max(...ys)) / 2).toFixed(6),
        lng: ((Math.min(...xs) + Math.max(...xs)) / 2).toFixed(6),
      };
    })();

    const fields = [
      form.plotId,
      form.farm,
      form.producer,
      form.supplier,
      form.car,
      form.municipality,
      form.state,
      form.region,
      areaHa,
      center.lat,
      center.lng,
      form.mappedAt,
      form.checkedAt,
      form.compliance,
      form.notes,
      form.mappedBy,
    ];

    const tsvRow = fields.join("\t");
    try {
      await navigator.clipboard.writeText(tsvRow);
      setCopySuccess(true);
      onShowToast?.("success", "Linha formatada para o SharePoint copiada para a área de transferência!");
      setTimeout(() => setCopySuccess(false), 3000);

      const activeUser = loggedUserKey || "usuario";
      const activeName = form.mappedBy || activeUser;
      recordAuditLog(activeUser, activeName, "SHAREPOINT_COPIED", "EXPORTACAO", `Copiou dados do talhão "${form.plotId}" para área de transferência (SharePoint).`, form.plotId);
    } catch {
      onShowToast?.("error", "Não foi possível copiar para a área de transferência.");
    }
  };

  const handlePublishToR2 = async () => {
    if (!geometry) return;
    setR2Publishing(true);
    setExporting(true);
    try {
      const { geoJsonStr, baseName } = await generateFullZipPackage();

      setExportStep("r2_upload");
      setExportStepMessage("Publicando arquivos no Cloudflare R2 Vault...");

      const regionKey = form.region ? form.region.toLowerCase().replace(/[^a-z0-9]/g, "_") : "geral";
      const plotCode = form.plotId.trim().toUpperCase();

      const res = await fetch("/api/r2/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          region: regionKey,
          plotCode,
          geoJson: geoJsonStr,
          metadata: {
            ...form,
            areaHectares: calculateAreaHectares(geometry),
            publishedAt: new Date().toISOString(),
            publishedBy: loggedUserKey,
          },
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Falha ao publicar no R2.");
      }

      setR2Success(true);
      setExportStep("done");
      setExportStepMessage("Publicado com sucesso no Cloudflare R2!");
      onShowToast?.("success", `Talhão ${plotCode} publicado com sucesso na Nuvem R2!`);

      const activeUser = loggedUserKey || "usuario";
      const activeName = form.mappedBy || activeUser;
      recordAuditLog(activeUser, activeName, "R2_PUBLISHED", "EXPORTACAO", `Publicou geometria e metadados do talhão "${plotCode}" no bucket Cloudflare R2 (${regionKey}).`, plotCode);
      setTimeout(() => setR2Success(false), 4000);
    } catch (e: any) {
      setExportStep("error");
      setExportStepMessage(e.message || "Erro ao publicar no Cloudflare R2.");
      onShowToast?.("error", e.message || "Erro ao publicar no R2.");
    } finally {
      setR2Publishing(false);
      setTimeout(() => {
        setExporting(false);
        setExportStep("idle");
      }, 1500);
    }
  };

  return {
    exporting,
    exportStep,
    exportStepMessage,
    copySuccess,
    r2Publishing,
    r2Success,
    handleDownloadFullPackage: downloadFullPackage,
    handleDownloadGeoJsonOnly: downloadGeoJsonOnly,
    handleCopySharepointRow,
    handlePublishToR2,
  };
}
