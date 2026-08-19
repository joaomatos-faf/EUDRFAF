import { useState, useCallback, useMemo } from "react";
import {
  type GeometryData,
  buildEudrGeoJson,
  buildShapefileZip,
  buildShapefileParts,
  zipStore,
  zipStoreBytes,
  calculateAreaHectares,
  downloadBlob,
  parseGeometryFile,
  buildProducerXlsxBytes,
} from "../lib/eudr";
import type { FormState, MapbiomasCheck } from "../lib/types";
import type { AuditLogEntry } from "../lib/auditLogger";

type AuditLogFn = (user: string, name: string, action: AuditLogEntry["action"], category: AuditLogEntry["category"], detail: string, plotId?: string) => void;

/**
 * Hook para gerenciar importação de geometria, cálculo de área e exportações.
 */
export function useGeometryExport(
  form: FormState,
  normalizedId: string,
  mapbiomasCheck: MapbiomasCheck,
  recordAuditLog: AuditLogFn,
  loggedUserKey: string | null,
) {
  const [geometry, setGeometry] = useState<GeometryData | null>(null);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");

  const area = useMemo(
    () => (geometry ? calculateAreaHectares(geometry) : 0),
    [geometry],
  );

  const centerCoord = useMemo(() => {
    if (!geometry) return null;
    const points = geometry.polygons.flat(2);
    if (!points.length) return null;
    const xs = points.map((point) => point[0]);
    const ys = points.map((point) => point[1]);
    return {
      lng: (Math.min(...xs) + Math.max(...xs)) / 2,
      lat: (Math.min(...ys) + Math.max(...ys)) / 2,
    };
  }, [geometry]);

  const processSelectedFile = useCallback(async (file: File, mappedBy: string) => {
    setError("");
    try {
      const parsed = await parseGeometryFile(file);
      setGeometry(parsed);
      setFileName(file.name);

      const activeUser = loggedUserKey || "usuario";
      const activeName = mappedBy || activeUser;
      recordAuditLog(
        activeUser,
        activeName,
        "FILE_UPLOADED",
        "GEOMETRIA",
        `Importou o arquivo "${file.name}" com ${parsed.polygons.length} polígono(s).`,
        normalizedId || undefined,
      );
    } catch (problem) {
      setGeometry(null);
      setFileName("");
      setError(problem instanceof Error ? problem.message : "Não foi possível ler o arquivo.");
    }
  }, [loggedUserKey, normalizedId, recordAuditLog]);

  const handleFile = useCallback(async (event: React.ChangeEvent<HTMLInputElement>, mappedBy: string) => {
    const file = event.target.files?.[0];
    if (file) processSelectedFile(file, mappedBy);
  }, [processSelectedFile]);

  const handleDrop = useCallback(async (event: React.DragEvent<HTMLLabelElement>, mappedBy: string) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) processSelectedFile(file, mappedBy);
  }, [processSelectedFile]);

  const resetGeometry = useCallback(() => {
    setGeometry(null);
    setFileName("");
    setError("");
  }, []);

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
    downloadBlob(
      `${normalizedId}-cadastro.xlsx`,
      new Blob([xlsxBytes as unknown as BlobPart], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
    );
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

    const allFiles = [
      { name: `${normalizedId}.geojson`, data: geojsonBytes },
      { name: `${normalizedId}-cadastro.xlsx`, data: xlsxBytes },
      { name: `${normalizedId}-shapefile.zip`, data: shapefileZipBytes },
    ];

    const zipBlob = zipStore(allFiles);
    downloadBlob(`${normalizedId}-pacote-eudr.zip`, zipBlob);

    const activeUser = loggedUserKey || "usuario";
    const activeName = form.mappedBy || activeUser;
    recordAuditLog(
      activeUser,
      activeName,
      "PACKAGE_EXPORTED",
      "EXPORTACAO",
      `Exportou o pacote EUDR completo (.zip) para o talhão ${normalizedId} (${area.toFixed(2)} ha).`,
      normalizedId,
    );
  }, [geometry, normalizedId, area, mapbiomasCheck, form, loggedUserKey, recordAuditLog]);

  return {
    geometry,
    setGeometry,
    fileName,
    error,
    area,
    centerCoord,
    processSelectedFile,
    handleFile,
    handleDrop,
    resetGeometry,
    downloadGeoJson,
    downloadShape,
    downloadXlsx,
    exportAll,
  };
}
