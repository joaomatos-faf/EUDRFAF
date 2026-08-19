/**
 * Hook para gerenciamento de geometria e arquivos EUDR
 * Centraliza lógica de upload, processamento e validação de arquivos geométricos
 */

import { ChangeEvent, useState, useCallback } from "react";
import type { GeometryData } from "../lib/eudr";
import { parseGeometryFile } from "../lib/eudr";
import { UPLOAD_CONFIG } from "../lib/constants";

interface UseGeometryReturn {
  geometry: GeometryData | null;
  fileName: string;
  error: string;
  isDragging: boolean;
  isLoading: boolean;
  setGeometry: (geom: GeometryData | null) => void;
  setFileName: (name: string) => void;
  setError: (error: string) => void;
  handleFile: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleDragOver: (event: React.DragEvent<HTMLLabelElement>) => void;
  handleDragLeave: (event: React.DragEvent<HTMLLabelElement>) => void;
  handleDrop: (event: React.DragEvent<HTMLLabelElement>) => Promise<void>;
  clearGeometry: () => void;
}

export function useGeometry(): UseGeometryReturn {
  const [geometry, setGeometry] = useState<GeometryData | null>(null);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const processSelectedFile = useCallback(async (file: File) => {
    setIsLoading(true);
    setError("");
    
    // Validação de tamanho
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > UPLOAD_CONFIG.maxFileSizeMB) {
      setError(`Arquivo muito grande (${fileSizeMB.toFixed(2)} MB). Máximo: ${UPLOAD_CONFIG.maxFileSizeMB} MB`);
      setIsLoading(false);
      return;
    }

    // Validação de formato
    const fileExt = "." + file.name.split(".").pop()?.toLowerCase();
    if (!UPLOAD_CONFIG.acceptedFormats.includes(fileExt)) {
      setError(`Formato não suportado: ${fileExt}. Formatos aceitos: ${UPLOAD_CONFIG.acceptedFormats.join(", ")}`);
      setIsLoading(false);
      return;
    }

    try {
      const result = await parseGeometryFile(file);
      setGeometry(result.geometry);
      setFileName(file.name);
    } catch (problem) {
      setGeometry(null);
      setFileName("");
      setError(problem instanceof Error ? problem.message : "Não foi possível ler o arquivo.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleFile = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) await processSelectedFile(file);
  }, [processSelectedFile]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    if (!isDragging) setIsDragging(true);
  }, [isDragging]);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) await processSelectedFile(file);
  }, [processSelectedFile]);

  const clearGeometry = useCallback(() => {
    setGeometry(null);
    setFileName("");
    setError("");
  }, []);

  return {
    geometry,
    fileName,
    error,
    isDragging,
    isLoading,
    setGeometry,
    setFileName,
    setError,
    handleFile,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    clearGeometry,
  };
}
