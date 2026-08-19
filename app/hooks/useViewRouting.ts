import { useState, useEffect, useCallback } from "react";
import type { ActiveView } from "../lib/types";

/**
 * Hook para gerenciar a navegação entre views da aplicação
 * (landing, app, portal, contratos, dashboard).
 *
 * Lida com:
 * - Detecção de subdomínio (app., portal., contratos., dashboard., cloud.)
 * - Parâmetros de URL (?view=...)
 * - Persistência da view ativa no sessionStorage
 */
export function useViewRouting(loggedUserRole: string | undefined, isAuthenticated: boolean | null) {
  const [activeView, setActiveViewState] = useState<ActiveView>("landing");

  const setActiveView = useCallback((view: ActiveView) => {
    setActiveViewState(view);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("faf_eudr_active_view", view);
    }
  }, []);

  // Detecta view inicial baseado em hostname, query params e hash
  useEffect(() => {
    if (typeof window === "undefined") return;

    const host = window.location.hostname.toLowerCase();
    const search = window.location.search.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    const savedView = sessionStorage.getItem("faf_eudr_active_view") as ActiveView | null;

    // Subdomínio cloud. redireciona
    if (host.startsWith("cloud.") || search.includes("view=cloud")) {
      if (window.location.pathname !== "/cloud") {
        window.location.href = "/cloud";
        return;
      }
    }

    const detectView = (): ActiveView => {
      if (host.startsWith("dashboard.") || search.includes("view=dashboard") || hash.includes("dashboard")) return "dashboard";
      if (host.startsWith("contratos.") || search.includes("view=contratos") || hash.includes("contratos")) return "contratos";
      if (host.startsWith("portal.") || host.startsWith("cliente.") || search.includes("view=portal") || hash.includes("portal")) return "portal";
      if (host.startsWith("app.") || host.startsWith("preparador.") || search.includes("view=app") || hash.includes("app")) return "app";
      if (search.includes("view=landing") || hash.includes("landing")) return "landing";
      if (savedView && ["landing", "app", "portal", "contratos", "dashboard"].includes(savedView)) return savedView;
      return "landing";
    };

    setActiveViewState(detectView());
  }, []);

  // Força redirect para portal se usuário é do tipo "client"
  useEffect(() => {
    if (loggedUserRole === "client" && activeView !== "portal") {
      setActiveView("portal");
    }
  }, [loggedUserRole, activeView, setActiveView]);

  return { activeView, setActiveView };
}
