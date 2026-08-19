import { useState, useCallback } from "react";
import { buildEudrGeoJson, type GeometryData } from "../lib/eudr";
import type { FormState } from "../lib/types";
import type { AuditLogEntry } from "../lib/auditLogger";

type AuditLogFn = (user: string, name: string, action: AuditLogEntry["action"], category: AuditLogEntry["category"], detail: string, plotId?: string) => void;

/**
 * Hook para gerenciar publicação de GeoJSON no Cloudflare R2.
 */
export function useR2Publish(
  geometry: GeometryData | null,
  normalizedId: string,
  area: number,
  form: FormState,
  recordAuditLog: AuditLogFn,
  loggedUserKey: string | null,
) {
  const [contractIdToPublish] = useState("2026-C001");
  const [isPublishingR2, setIsPublishingR2] = useState(false);
  const [lastPublishedR2Key, setLastPublishedR2Key] = useState<string | null>(null);

  const publishToCloudflareR2 = useCallback(async () => {
    if (!geometry || !normalizedId) return;
    setIsPublishingR2(true);

    try {
      const geojsonContent = JSON.stringify(buildEudrGeoJson(geometry, normalizedId, area), null, 2);
      const activeUser = loggedUserKey || "usuario";
      const activeName = form.mappedBy || activeUser;

      const res = await fetch("/api/r2/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plotId: normalizedId,
          contractId: contractIdToPublish,
          producer: form.producer || "N/A",
          supplier: form.supplier || form.producer || "N/A",
          farm: form.farm || "N/A",
          region: form.region || "GERAL",
          municipality: form.municipality || "N/A",
          state: form.state || "N/A",
          area,
          compliance: form.compliance || "CONFORME",
          publishedBy: activeName,
          geojsonContent,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setLastPublishedR2Key(data.key);
        recordAuditLog(
          activeUser,
          activeName,
          "PACKAGE_EXPORTED",
          "EXPORTACAO",
          `Publicou o GeoJSON do talhão ${normalizedId} no Cloudflare R2 em ${data.key}.`,
          normalizedId,
        );
        alert(`✅ Arquivo GeoJSON enviado com sucesso para o Cloudflare R2!\n\nCaminho: ${data.key}`);
      } else {
        throw new Error(data.error || "Erro ao publicar GeoJSON no Cloudflare R2.");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido ao publicar no R2.";
      alert(`⚠️ Falha no envio do GeoJSON: ${msg}`);
    } finally {
      setIsPublishingR2(false);
    }
  }, [geometry, normalizedId, area, form, contractIdToPublish, loggedUserKey, recordAuditLog]);

  const handleDownloadR2GeoJsonDirect = useCallback(async (key: string) => {
    try {
      const res = await fetch(`/api/r2/download?key=${encodeURIComponent(key)}`);
      const data = await res.json();
      if (data.success && data.downloadUrl) {
        const a = document.createElement("a");
        a.href = data.downloadUrl;
        a.download = `${normalizedId}.geojson`;
        a.target = "_blank";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        throw new Error(data.error || "Não foi possível obter a URL do R2.");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao baixar.";
      alert(`⚠️ ${msg}`);
    }
  }, [normalizedId]);

  return {
    isPublishingR2,
    lastPublishedR2Key,
    publishToCloudflareR2,
    handleDownloadR2GeoJsonDirect,
  };
}
