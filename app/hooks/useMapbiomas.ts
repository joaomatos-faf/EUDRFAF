/**
 * Hook para consultas ao MapBiomas com cache
 * Implementa cache em localStorage para evitar consultas repetidas
 */

import { useState, useCallback, useRef } from "react";
import type { GeometryData, FormState, MapbiomasCheck } from "../lib/constants";
import { emptyMapbiomasCheck, MAPBIOMAS_CACHE_TTL_MS } from "../lib/constants";
import { recordAuditLog } from "../lib/auditLogger";

interface CacheEntry {
  result: any;
  timestamp: number;
  geometryHash: string;
}

function hashGeometry(geometry: GeometryData): string {
  // Hash simples baseado nas coordenadas
  const points = geometry.polygons.flat(2);
  return points.map(p => p.join(",")).join("|");
}

interface UseMapbiomasReturn {
  mapbiomasCheck: MapbiomasCheck;
  isChecking: boolean;
  checkMapbiomas: () => Promise<void>;
  clearCheck: () => void;
}

interface UseMapbiomasParams {
  geometry: GeometryData | null;
  form: FormState;
  normalizedId: string;
  userMgmt: {
    loggedUserKey: string;
  };
  onChecked?: (checkedAt: string) => void;
  onInvalidate?: () => void;
}

export function useMapbiomas({ geometry, form, normalizedId, userMgmt, onChecked, onInvalidate }: UseMapbiomasParams): UseMapbiomasReturn {
  const [mapbiomasCheck, setMapbiomasCheck] = useState<MapbiomasCheck>(emptyMapbiomasCheck);
  const [isChecking, setIsChecking] = useState(false);
  const cacheRef = useRef<Map<string, CacheEntry>>(new Map());

  const getFromCache = useCallback((geomHash: string): any | null => {
    if (typeof window === "undefined") return null;
    
    try {
      const cached = cacheRef.current.get(geomHash);
      if (cached && Date.now() - cached.timestamp < MAPBIOMAS_CACHE_TTL_MS) {
        return cached.result;
      }
      
      // Tentar carregar do localStorage
      const stored = localStorage.getItem(`mapbiomas_cache_${geomHash}`);
      if (stored) {
        const parsed = JSON.parse(stored) as CacheEntry;
        if (Date.now() - parsed.timestamp < MAPBIOMAS_CACHE_TTL_MS) {
          cacheRef.current.set(geomHash, parsed);
          return parsed.result;
        }
        localStorage.removeItem(`mapbiomas_cache_${geomHash}`);
      }
    } catch (e) {
      console.warn("Erro ao ler cache do MapBiomas:", e);
    }
    return null;
  }, []);

  const saveToCache = useCallback((geomHash: string, result: any) => {
    if (typeof window === "undefined") return;
    
    try {
      const entry: CacheEntry = { result, timestamp: Date.now(), geometryHash: geomHash };
      cacheRef.current.set(geomHash, entry);
      
      // Salvar no localStorage (com limite de tamanho)
      try {
        localStorage.setItem(`mapbiomas_cache_${geomHash}`, JSON.stringify(entry));
      } catch (e) {
        // localStorage cheio, limpar caches antigos
        console.warn("localStorage cheio, limpando caches antigos");
        const keys = Object.keys(localStorage).filter(k => k.startsWith("mapbiomas_cache_"));
        keys.slice(0, Math.ceil(keys.length / 2)).forEach(k => localStorage.removeItem(k));
      }
    } catch (e) {
      console.warn("Erro ao salvar cache do MapBiomas:", e);
    }
  }, []);

  const checkMapbiomas = useCallback(async () => {
    if (!geometry) return;
    
    setIsChecking(true);
    setMapbiomasCheck({ ...emptyMapbiomasCheck, status: "loading" });
    
    try {
      // Verificar cache primeiro
      const geomHash = hashGeometry(geometry);
      const cachedResult = getFromCache(geomHash);
      
      if (cachedResult) {
        console.log("MapBiomas: resultado do cache");
        const mappedArea = cachedResult.areaHa ?? 0;
        setMapbiomasCheck({
          status: cachedResult.hasChanges ? "attention" : "clear",
          areaHa: mappedArea,
          checkedAt: cachedResult.checkedAt ?? new Date().toISOString(),
          message: "",
          verificationUrl: cachedResult.verificationUrl ?? "",
          changes: cachedResult.changes ?? [],
        });
        if (onChecked) onChecked(cachedResult.checkedAt ?? new Date().toISOString());
        setIsChecking(false);
        return;
      }

      // Fazer requisição à API
      const response = await fetch("/api/mapbiomas/check", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          geometry,
          details: { ...form, plotId: normalizedId, checkedAt: new Date().toISOString().slice(0, 10) },
        }),
      });
      
      const result = await response.json() as {
        areaHa?: number;
        hasChanges?: boolean;
        changes?: MapbiomasCheck["changes"];
        checkedAt?: string;
        verificationUrl?: string;
        error?: string;
      };
      
      if (!response.ok) throw new Error(result.error || "Não foi possível consultar o MapBiomas.");
      
      // Salvar no cache
      saveToCache(geomHash, result);
      
      const mappedArea = result.areaHa ?? 0;
      setMapbiomasCheck({
        status: result.hasChanges ? "attention" : "clear",
        areaHa: mappedArea,
        checkedAt: result.checkedAt ?? new Date().toISOString(),
        message: "",
        verificationUrl: result.verificationUrl ?? "",
        changes: result.changes ?? [],
      });
      
      if (onChecked) onChecked(result.checkedAt ?? new Date().toISOString());

      const activeUser = userMgmt.loggedUserKey || "usuario";
      const activeName = form.mappedBy || activeUser;
      recordAuditLog(
        activeUser,
        activeName,
        "MAPBIOMAS_CHECKED",
        "MAPBIOMAS",
        `Consultou MapBiomas 2020-2024 para ${normalizedId || "talhão"}: ${result.hasChanges ? `${result.changes?.length || 1} alteração(ões) de cobertura` : "sem perda de vegetação florestal"}.`,
        normalizedId || undefined
      );
    } catch (problem) {
      setMapbiomasCheck({
        ...emptyMapbiomasCheck,
        status: "error",
        message: problem instanceof Error ? problem.message : "Não foi possível consultar o MapBiomas.",
      });
      if (onInvalidate) onInvalidate();
    } finally {
      setIsChecking(false);
    }
  }, [geometry, form, normalizedId, userMgmt, getFromCache, saveToCache, onChecked, onInvalidate]);

  const clearCheck = useCallback(() => {
    setMapbiomasCheck(emptyMapbiomasCheck);
  }, []);

  return {
    mapbiomasCheck,
    isChecking,
    checkMapbiomas,
    clearCheck,
  };
}
