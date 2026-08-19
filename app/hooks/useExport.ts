/**
 * Hook para operações de exportação EUDR
 * Centraliza lógica de download de GeoJSON, Shapefile, XLSX e pacotes completos
 */

import { useCallback } from "react";
import type { GeometryData, FormState, MapbiomasCheck } from "../lib/constants";
import {
  buildEudrGeoJson,
  buildShapefileZip,
  buildShapefileParts,
  zipStore,
  zipStoreBytes,
  buildProducerXlsxBytes,
} from "../lib/eudr";
import { downloadBlob } from "../lib/eudr";
import { recordAuditLog } from "../lib/auditLogger";

interface UseExportReturn {
  downloadGeoJson: () => void;
  downloadShape: () => void;
  downloadXlsx: () => void;
  exportAll: () => void;
}

interface UseExportParams {
  geometry: GeometryData | null;
  normalizedId: string;
  area: number;
  form: FormState;
  mapbiomasCheck: MapbiomasCheck;
  userMgmt: {
    loggedUserKey: string;
  };
}

export function useExport({ geometry, normalizedId, area, form, mapbiomasCheck, userMgmt }: UseExportParams): UseExportReturn {
  const downloadGeoJson = useCallback(() => {
    if (!geometry || !normalizedId) return;
    const content = JSON.stringify(buildEudrGeoJson(geometry, normalizedId, area), null, 2);
    downloadBlob(`${normalizedId}.geojson`, new Blob([content], { type: "application/geo+json" }));
  }, [geometry, normalizedId, area]);

  const downloadShape = useCallback(() => {
    if (!geometry || !normalizedId) return;
    downloadBlob(`${normalizedId}-shapefile.zip`, buildShapefileZip(geometry, normalizedId, area, form));
  }, [geometry, normalizedId, area, form]);

  const downloadXlsx = useCallback(() => {
    if (!normalizedId) return;
    const automaticNote = mapbiomasCheck.checkedAt
      ? `MapBiomas Cobertura (2020–2024): ${mapbiomasCheck.changes.length ? `${mapbiomasCheck.changes.length} alteração(ões) de cobertura` : "sem perda de vegetação florestal"}.${mapbiomasCheck.verificationUrl ? ` Verificação: ${mapbiomasCheck.verificationUrl}.` : ""}`
      : "MapBiomas: consulta automática não realizada.";
    const notes = [form.notes.trim(), automaticNote].filter(Boolean).join(" ");
    const xlsxBytes = buildProducerXlsxBytes({ ...form, notes, plotId: normalizedId, area });
    downloadBlob(`${normalizedId}-cadastro.xlsx`, new Blob([xlsxBytes as unknown as BlobPart], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
  }, [normalizedId, mapbiomasCheck, form, area]);

  const exportAll = useCallback(() => {
    if (!geometry || !normalizedId) return;

    // 1. GeoJSON
    const geojsonContent = JSON.stringify(buildEudrGeoJson(geometry, normalizedId, area), null, 2);
    const geojsonBytes = new TextEncoder().encode(geojsonContent);

    // 2. XLSX
    const automaticNote = mapbiomasCheck.checkedAt
      ? `MapBiomas Cobertura (2020–2024): ${mapbiomasCheck.changes.length ? `${mapbiomasCheck.changes.length} alteração(ões) de cobertura` : "sem perda de vegetação florestal"}.${mapbiomasCheck.verificationUrl ? ` Verificação: ${mapbiomasCheck.verificationUrl}.` : ""}`
      : "MapBiomas: consulta automática não realizada.";
    const notes = [form.notes.trim(), automaticNote].filter(Boolean).join(" ");
    const xlsxBytes = buildProducerXlsxBytes({ ...form, notes, plotId: normalizedId, area });

    // 3. Shapefile em ZIP interno
    const shapeParts = buildShapefileParts(geometry, normalizedId, area, form);
    const shapefileZipBytes = zipStoreBytes(shapeParts);

    // Junta tudo no pacote principal mantendo o shapefile.zip comprimido
    const allFiles = [
      { name: `${normalizedId}.geojson`, data: geojsonBytes },
      { name: `${normalizedId}-cadastro.xlsx`, data: xlsxBytes },
      { name: `${normalizedId}-shapefile.zip`, data: shapefileZipBytes },
    ];

    const zipBlob = zipStore(allFiles);
    downloadBlob(`${normalizedId}-pacote-eudr.zip`, zipBlob);

    const activeUser = userMgmt.loggedUserKey || "usuario";
    const activeName = form.mappedBy || activeUser;
    recordAuditLog(
      activeUser,
      activeName,
      "PACKAGE_EXPORTED",
      "EXPORTACAO",
      `Exportou o pacote EUDR completo (.zip) para o talhão ${normalizedId} (${area.toFixed(2)} ha).`,
      normalizedId
    );
  }, [geometry, normalizedId, area, form, mapbiomasCheck, userMgmt]);

  return {
    downloadGeoJson,
    downloadShape,
    downloadXlsx,
    exportAll,
  };
}
