export type Locale = "pt" | "en";

export const translations: Record<Locale, Record<string, string>> = {
  pt: {
    // Topbar & Navigation
    "nav.title": "Preparador EUDR",
    "nav.home": "🏠 Início",
    "nav.preparer": "🗺️ Preparador",
    "nav.dashboard": "📊 Dashboard",
    "nav.contracts": "📑 Contratos",
    "nav.cloud": "☁️ Nuvem R2",
    "nav.audit": "Auditoria",
    "nav.users": "Usuários",
    "nav.logout": "Sair",
    "nav.newProcess": "+ Novo Processo",
    "nav.accessSystem": "Acessar Sistema ›",

    // Landing Page
    "landing.tagline": "Fazenda Ambiental Fortaleza · Acesso Seguro",
    "landing.heading": "Selecione seu portal de entrada.",
    "landing.g1.tag": "Equipe & Agrônomos",
    "landing.g1.title": "Preparar e Auditar Talhões",
    "landing.g1.desc": "Mapeamento poligonal, desenho de áreas, validação temporal MapBiomas / EUDR e exportação de pacotes.",
    "landing.g2.tag": "Importadores & Torrefações",
    "landing.g2.title": "Contratos e Arquivos GeoJSON",
    "landing.g2.desc": "Consulta de lotes e download direto de pacotes auditados para desembaraço na União Europeia.",
    "landing.g3.tag": "Infraestrutura Cloud",
    "landing.g3.title": "Repositório Cloudflare R2",
    "landing.g3.desc": "Armazenamento seguro e gestão de geometrias e auditorias das 13 regiões cafeeiras.",

    // Client Portal
    "portal.title": "Portal do Cliente & Importador",
    "portal.subtitle": "Dossiês de conformidade EUDR e download de polígonos certificados.",
    "portal.searchPlaceholder": "Buscar por contrato, talhão, produtor ou município...",
    "portal.downloadDossier": "Baixar Dossiê Completo (.zip)",
    "portal.downloadGeoJson": "Baixar GeoJSON WGS84",
    "portal.viewMap": "Visualizar Mapa",
    "portal.noDossiers": "Nenhum dossiê de conformidade encontrado para este perfil.",

    // Due Diligence
    "report.dueDiligenceTitle": "Declaração de Diligência Prévia (EUDR)",
    "report.regulation": "Regulamento (UE) 2023/1115 · Desmatamento Zero",
    "report.certificate": "Certificado de Conformidade Geoespacial",
    "report.print": "Imprimir / Salvar PDF",
    "report.close": "Fechar",
  },
  en: {
    // Topbar & Navigation
    "nav.title": "EUDR Preparer",
    "nav.home": "🏠 Home",
    "nav.preparer": "🗺️ Preparer",
    "nav.dashboard": "📊 Dashboard",
    "nav.contracts": "📑 Contracts",
    "nav.cloud": "☁️ Cloud R2",
    "nav.audit": "Audit Logs",
    "nav.users": "Users",
    "nav.logout": "Sign Out",
    "nav.newProcess": "+ New Process",
    "nav.accessSystem": "Access System ›",

    // Landing Page
    "landing.tagline": "Fazenda Ambiental Fortaleza · Secure Access",
    "landing.heading": "Select your entry gateway.",
    "landing.g1.tag": "Team & Agronomists",
    "landing.g1.title": "Prepare and Audit Farm Plots",
    "landing.g1.desc": "Polygon mapping, land boundary drawing, MapBiomas/EUDR temporal audit and compliance packaging.",
    "landing.g2.tag": "Importers & Roasters",
    "landing.g2.title": "Contracts & GeoJSON Files",
    "landing.g2.desc": "Lot traceability search and direct download of certified EUDR packages for European customs clearance.",
    "landing.g3.tag": "Cloud Infrastructure",
    "landing.g3.title": "Cloudflare R2 Vault",
    "landing.g3.desc": "Secure cloud storage and polygon geometry management across 13 Brazilian coffee origins.",

    // Client Portal
    "portal.title": "Client & Importer Portal",
    "portal.subtitle": "EUDR Compliance Dossiers & certified polygon downloads.",
    "portal.searchPlaceholder": "Search by contract, plot code, producer, or origin...",
    "portal.downloadDossier": "Download Full Dossier (.zip)",
    "portal.downloadGeoJson": "Download GeoJSON WGS84",
    "portal.viewMap": "View Polygon Map",
    "portal.noDossiers": "No compliance dossiers found for this account.",

    // Due Diligence
    "report.dueDiligenceTitle": "Due Diligence Statement (EUDR)",
    "report.regulation": "Regulation (EU) 2023/1115 · Deforestation-Free",
    "report.certificate": "Geospatial Compliance Certificate",
    "report.print": "Print / Save as PDF",
    "report.close": "Close",
  },
};
