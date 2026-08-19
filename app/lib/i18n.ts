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

    // Auth & Login
    "auth.login": "Iniciar Sessão",
    "auth.eyebrow": "FAF Coffees · Sustentabilidade",
    "auth.subtitle": "Informe suas credenciais para acessar a plataforma geoespacial EUDR.",
    "auth.username": "Usuário",
    "auth.password": "Senha",
    "auth.continue": "Continuar ›",
    "auth.back": "‹ Voltar ao Início",
    "auth.placeholderUser": "ex: joao",
    "auth.placeholderPass": "••••••••",

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

    // Steps Navigation
    "step.1": "1. Identificação",
    "step.2": "2. Geometria",
    "step.3": "3. Localização",
    "step.4": "4. Validação",
    "step.5": "5. Exportação",

    // Form & Plot Identification
    "form.plotTitle": "Identificação do Talhão",
    "form.supplier": "Fornecedor / Cooperativa",
    "form.producer": "Produtor(a)",
    "form.farm": "Fazenda / Sítio",
    "form.municipality": "Município",
    "form.state": "Estado (UF)",
    "form.car": "Código CAR",
    "form.carConfirm": "CAR auditado e válido",
    "form.plotId": "Código do Talhão (EUDR)",
    "form.contractId": "Número do Contrato",
    "form.mappedBy": "Mapeado por (Agrônomo)",

    // Geometry & Map
    "geo.title": "Importação & Desenho de Geometria",
    "geo.uploadTitle": "Arraste KML, GeoJSON ou ZIP Shapefile",
    "geo.drawBtn": "Desenhar Polígono no Mapa",
    "geo.points": "Vértices",
    "geo.areaHa": "Área (Hectares)",
    "geo.simplify": "Simplificar Geometria",
    "geo.topologyValid": "Topologia Válida (WGS84)",
    "geo.topologyInvalid": "Erro de Topologia",

    // MapBiomas Compliance
    "mb.title": "Validação Temporal MapBiomas (EUDR)",
    "mb.verifyBtn": "Executar Auditoria MapBiomas",
    "mb.cutoffDate": "Marco Temporal: 31/12/2020",
    "mb.compliant": "Conforme EUDR (Sem Desmatamento Pós-2020)",
    "mb.nonCompliant": "Alerta de Não Conformidade",

    // Export & Dossier
    "export.title": "Exportação & Pacote de Conformidade",
    "export.geojson": "Baixar GeoJSON (WGS84)",
    "export.shapefile": "Baixar Shapefile (.zip)",
    "export.excel": "Baixar Planilha de Cadastro (.xlsx)",
    "export.dossier": "Gerar Dossiê Completo EUDR (.zip)",
    "export.dueDiligence": "Visualizar Declaração Due Diligence",
    "export.publishR2": "Publicar no Cloudflare R2",

    // Client Portal & Contracts
    "portal.title": "Portal do Cliente & Importador",
    "portal.subtitle": "Dossiês de conformidade EUDR e download de polígonos certificados.",
    "portal.searchPlaceholder": "Buscar por contrato, talhão, produtor ou município...",
    "portal.downloadDossier": "Baixar Dossiê Completo (.zip)",
    "portal.downloadGeoJson": "Baixar GeoJSON WGS84",
    "portal.viewMap": "Visualizar Mapa",
    "portal.noDossiers": "Nenhum dossiê de conformidade encontrado para este perfil.",
    "contracts.title": "Gestão de Contratos e Lotes EUDR",
    "contracts.subtitle": "Rastreabilidade e consolidação de polígonos por contrato de exportação.",
    "contracts.search": "Filtrar por contrato, cliente ou produtor...",

    // Dashboard
    "dash.title": "Painel Executivo de Conformidade EUDR",
    "dash.subtitle": "Monitoramento em tempo real das origens cafeeiras FAF Coffees.",
    "dash.totalPlots": "Total de Talhões",
    "dash.totalArea": "Área Total Auditada",
    "dash.verifiedLots": "Lotes Certificados",
    "dash.regions": "Regiões Mapeadas",

    // Cloud Explorer
    "cloud.title": "Repositório Cloudflare R2",
    "cloud.subtitle": "Armazenamento seguro de geometrias e documentos de due diligence.",
    "cloud.search": "Buscar arquivos no bucket R2...",
    "cloud.allFiles": "Todos os Arquivos",
    "cloud.contracts": "Contratos",
    "cloud.upload": "Enviar Arquivo",

    // Due Diligence Report
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

    // Auth & Login
    "auth.login": "Sign In",
    "auth.eyebrow": "FAF Coffees · Sustainability",
    "auth.subtitle": "Enter your credentials to access the EUDR geospatial platform.",
    "auth.username": "Username",
    "auth.password": "Password",
    "auth.continue": "Continue ›",
    "auth.back": "‹ Back to Home",
    "auth.placeholderUser": "e.g. joao",
    "auth.placeholderPass": "••••••••",

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

    // Steps Navigation
    "step.1": "1. Identification",
    "step.2": "2. Geometry",
    "step.3": "3. Location",
    "step.4": "4. Validation",
    "step.5": "5. Export",

    // Form & Plot Identification
    "form.plotTitle": "Farm Plot Identification",
    "form.supplier": "Supplier / Cooperative",
    "form.producer": "Farmer / Producer",
    "form.farm": "Farm Name",
    "form.municipality": "Municipality",
    "form.state": "State (UF)",
    "form.car": "CAR Registry Code",
    "form.carConfirm": "Audited and valid CAR",
    "form.plotId": "Plot ID (EUDR Code)",
    "form.contractId": "Contract Number",
    "form.mappedBy": "Mapped by (Agronomist)",

    // Geometry & Map
    "geo.title": "Geometry Import & Drawing",
    "geo.uploadTitle": "Drop KML, GeoJSON or ZIP Shapefile",
    "geo.drawBtn": "Draw Polygon on Map",
    "geo.points": "Vertices",
    "geo.areaHa": "Area (Hectares)",
    "geo.simplify": "Simplify Geometry",
    "geo.topologyValid": "Valid Topology (WGS84)",
    "geo.topologyInvalid": "Topology Error",

    // MapBiomas Compliance
    "mb.title": "MapBiomas Temporal Audit (EUDR)",
    "mb.verifyBtn": "Run MapBiomas Audit",
    "mb.cutoffDate": "Cutoff Date: 31/12/2020",
    "mb.compliant": "EUDR Compliant (Deforestation-Free Post-2020)",
    "mb.nonCompliant": "Non-Compliance Alert",

    // Export & Dossier
    "export.title": "Export & Compliance Package",
    "export.geojson": "Download GeoJSON (WGS84)",
    "export.shapefile": "Download Shapefile (.zip)",
    "export.excel": "Download Registration Sheet (.xlsx)",
    "export.dossier": "Generate Full EUDR Dossier (.zip)",
    "export.dueDiligence": "View Due Diligence Statement",
    "export.publishR2": "Publish to Cloudflare R2",

    // Client Portal & Contracts
    "portal.title": "Client & Importer Portal",
    "portal.subtitle": "EUDR Compliance Dossiers & certified polygon downloads.",
    "portal.searchPlaceholder": "Search by contract, plot code, producer, or origin...",
    "portal.downloadDossier": "Download Full Dossier (.zip)",
    "portal.downloadGeoJson": "Download GeoJSON WGS84",
    "portal.viewMap": "View Polygon Map",
    "portal.noDossiers": "No compliance dossiers found for this account.",
    "contracts.title": "EUDR Contracts & Lot Management",
    "contracts.subtitle": "Traceability and polygon consolidation per export contract.",
    "contracts.search": "Filter by contract, client or producer...",

    // Dashboard
    "dash.title": "Executive EUDR Compliance Dashboard",
    "dash.subtitle": "Real-time monitoring of FAF Coffees sustainable origins.",
    "dash.totalPlots": "Total Farm Plots",
    "dash.totalArea": "Total Audited Area",
    "dash.verifiedLots": "Certified Lots",
    "dash.regions": "Mapped Origins",

    // Cloud Explorer
    "cloud.title": "Cloudflare R2 Storage Vault",
    "cloud.subtitle": "Secure storage for polygon geometries and due diligence packages.",
    "cloud.search": "Search files in R2 storage bucket...",
    "cloud.allFiles": "All Files",
    "cloud.contracts": "Contracts",
    "cloud.upload": "Upload File",

    // Due Diligence Report
    "report.dueDiligenceTitle": "Due Diligence Statement (EUDR)",
    "report.regulation": "Regulation (EU) 2023/1115 · Deforestation-Free",
    "report.certificate": "Geospatial Compliance Certificate",
    "report.print": "Print / Save as PDF",
    "report.close": "Close",
  },
};
