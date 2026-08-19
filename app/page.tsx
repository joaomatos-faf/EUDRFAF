"use client";

import { useState, useCallback, useMemo, DragEvent, ChangeEvent, useEffect } from "react";
import "leaflet/dist/leaflet.css";
import { EudrHeader } from "./components/EudrHeader";
import { EudrStepsNav } from "./components/EudrStepsNav";
import { LoginScreen } from "./components/LoginScreen";
import { LandingPage } from "./components/LandingPage";
import { ContractManagerView } from "./components/ContractManagerView";
import { AdminUserModal } from "./components/AdminUserModal";
import { AuditLogModal } from "./components/AuditLogModal";
import { NewProcessModal } from "./components/NewProcessModal";
import { ClientPortalModal } from "./components/ClientPortalModal";
import { ServerStorageExplorer } from "./components/ServerStorageExplorer";
import ExecutiveDashboardView from "./components/ExecutiveDashboardView";
import { PlotIdentificationCard } from "./components/PlotIdentificationCard";
import { GeometryImporter } from "./components/GeometryImporter";
import { LocationComplianceCard } from "./components/LocationComplianceCard";
import { HumanValidationCard } from "./components/HumanValidationCard";
import { ExportCard } from "./components/ExportCard";
import { DueDiligenceReportModal } from "./components/DueDiligenceReportModal";
import { ToastContainer } from "./components/ui/ToastNotification";
import { useToast } from "./hooks/useToast";
import { useUserManagement } from "./hooks/useUserManagement";
import { useViewRouting } from "./hooks/useViewRouting";
import { useMunicipalities } from "./hooks/useMunicipalities";
import { useMapbiomasCheck } from "./hooks/useMapbiomasCheck";
import { useGeometryExport } from "./hooks/useGeometryExport";
import { useR2Publish } from "./hooks/useR2Publish";
import { recordAuditLog } from "./lib/auditLogger";
import {
  sanitizePlotId,
  generateAutoPlotId,
  incrementPlotIdNumber,
} from "./lib/eudr";
import type { FormState } from "./lib/types";
import {
  INITIAL_FORM,
  SHAPEFILE_DETAIL_FIELDS,
  today,
} from "./lib/types";

export default function Home() {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [carConfirmed, setCarConfirmed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [showCloudExplorer, setShowCloudExplorer] = useState(false);
  const [showNewProcessModal, setShowNewProcessModal] = useState(false);
  const [showDueDiligence, setShowDueDiligence] = useState(false);
  const { toasts, addToast, dismissToast } = useToast();

  // Hook de gerenciamento de usuário
  const userMgmt = useUserManagement((fullName) => {
    setForm((prev) => ({ ...prev, mappedBy: fullName }));
  });

  // Hook de roteamento de views
  const { activeView, setActiveView } = useViewRouting(
    userMgmt.loggedUserRole,
    userMgmt.isAuthenticated,
  );

  // Hook de MapBiomas (precisa da geometria, então usamos null inicialmente)
  const normalizedId = sanitizePlotId(form.plotId);
  const [geometryRef, setGeometryRef] = useState<import("./lib/eudr").GeometryData | null>(null);
  const mb = useMapbiomasCheck(
    form,
    geometryRef,
    normalizedId,
    recordAuditLog,
    userMgmt.loggedUserKey,
    setForm,
  );

  // Hook de geometria e exportação
  const geometryExport = useGeometryExport(
    form,
    normalizedId,
    mb.mapbiomasCheck,
    recordAuditLog,
    userMgmt.loggedUserKey,
  );

  // Sincroniza geometria para o hook de MapBiomas
  useEffect(() => {
    setGeometryRef(geometryExport.geometry);
  }, [geometryExport.geometry]);

  // Hook de municípios
  const computeNextPlotId = useCallback(
    (currentForm: FormState, updatedField: keyof FormState, newValue: string) => {
      const nextForm = { ...currentForm, [updatedField]: newValue };
      const supplierVal = nextForm.supplier || nextForm.producer;
      const municipalityVal = nextForm.municipality;
      const currentPlotId = currentForm.plotId;
      const isAutoOrEmpty = !currentPlotId || /^FAF/i.test(currentPlotId);

      if (isAutoOrEmpty && (supplierVal || municipalityVal)) {
        let plotNumber = "01";
        const numberMatch = currentPlotId.match(/-([0-9A-Z]+)$/i);
        if (numberMatch && numberMatch[1]) {
          plotNumber = numberMatch[1];
        }
        return generateAutoPlotId(supplierVal, municipalityVal, plotNumber);
      }
      return currentPlotId;
    },
    [],
  );

  const municipalities = useMunicipalities(
    form,
    setForm,
    computeNextPlotId,
    mb.resetMapbiomas,
  );

  // Hook de publicação R2
  const r2 = useR2Publish(
    geometryExport.geometry,
    normalizedId,
    geometryExport.area,
    form,
    recordAuditLog,
    userMgmt.loggedUserKey,
  );

  // Atualiza campo do formulário
  const update = useCallback(
    (field: keyof FormState, value: string) => {
      setForm((current) => {
        let nextPlotId = current.plotId;
        if (field === "supplier" || field === "producer" || field === "municipality") {
          nextPlotId = computeNextPlotId(current, field, value);
        }
        return {
          ...current,
          [field]: value,
          plotId: field === "plotId" ? value.toUpperCase() : nextPlotId,
        };
      });
      if (SHAPEFILE_DETAIL_FIELDS.has(field) && mb.mapbiomasCheck.checkedAt) {
        mb.resetMapbiomas();
      }
    },
    [computeNextPlotId, mb],
  );

  // Drag and drop handlers
  const handleDragOver = useCallback((event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    if (!isDragging) setIsDragging(true);
  }, [isDragging]);

  const handleDragLeave = useCallback((event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    async (event: DragEvent<HTMLLabelElement>) => {
      event.preventDefault();
      setIsDragging(false);
      const file = event.dataTransfer.files?.[0];
      if (file) geometryExport.processSelectedFile(file, form.mappedBy);
    },
    [geometryExport, form.mappedBy],
  );

  const handleFile = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) geometryExport.processSelectedFile(file, form.mappedBy);
    },
    [geometryExport, form.mappedBy],
  );

  // Verificação de readiness
  const ready = Boolean(
    geometryExport.geometry &&
      normalizedId &&
      form.supplier.trim() &&
      form.municipality.trim() &&
      form.state.trim() &&
      form.compliance &&
      form.mappedBy.trim() &&
      carConfirmed &&
      mb.mapbiomasConfirmed,
  );

  const nextPlotIdPreview = useMemo(() => {
    return incrementPlotIdNumber(normalizedId || form.plotId || "FAFDRAD-01");
  }, [normalizedId, form.plotId]);

  // Novo processo
  const handleStartFromScratch = useCallback(() => {
    const activeUser = userMgmt.loggedUserKey || "usuario";
    const activeName = form.mappedBy || activeUser;
    recordAuditLog(
      activeUser,
      activeName,
      "PROCESS_RESET",
      "GEOMETRIA",
      "Iniciou um novo processo do zero (limpeza total).",
    );

    setForm({
      ...INITIAL_FORM,
      mappedBy:
        form.mappedBy ||
        userMgmt.loggedUserKey ||
        (typeof window !== "undefined"
          ? sessionStorage.getItem("faf_eudr_user_name") || ""
          : ""),
    });
    geometryExport.resetGeometry();
    setCarConfirmed(false);
    mb.resetMapbiomas();
  }, [form.mappedBy, userMgmt.loggedUserKey, geometryExport, mb]);

  const handleNextPlotSameSupplier = useCallback(() => {
    const newPlotId = incrementPlotIdNumber(normalizedId || form.plotId);
    const activeUser = userMgmt.loggedUserKey || "usuario";
    const activeName = form.mappedBy || activeUser;
    recordAuditLog(
      activeUser,
      activeName,
      "PROCESS_RESET",
      "GEOMETRIA",
      `Iniciou próximo talhão para o mesmo fornecedor: código avançado para ${newPlotId}.`,
      newPlotId,
    );

    setForm((current) => ({
      ...current,
      plotId: newPlotId,
      mappedAt: today(),
      checkedAt: today(),
      compliance: "",
      notes: "",
    }));
    geometryExport.resetGeometry();
    setCarConfirmed(false);
    mb.resetMapbiomas();
  }, [normalizedId, form.plotId, form.mappedBy, userMgmt.loggedUserKey, geometryExport, mb]);

  const handleNewProcessClick = useCallback(() => {
    const hasData = Boolean(
      form.plotId ||
        form.farm ||
        form.producer ||
        form.supplier ||
        form.car ||
        form.municipality ||
        geometryExport.geometry,
    );
    if (hasData) {
      setShowNewProcessModal(true);
    } else {
      handleStartFromScratch();
    }
  }, [form, geometryExport.geometry, handleStartFromScratch]);

  // ─────────────────────────────────────────────────────────────
  // RENDERIZAÇÃO DAS VIEWS
  // ─────────────────────────────────────────────────────────────

  // 1. Landing Page
  if (activeView === "landing") {
    return (
      <LandingPage
        onOpenFafApp={() => setActiveView("app")}
        onOpenClientPortal={() => setActiveView("portal")}
        onOpenDashboard={() => setActiveView("dashboard")}
        onOpenCloud={() => {
          if (typeof window !== "undefined") {
            window.location.href = "/cloud";
          }
        }}
      />
    );
  }

  // 2. Executive Dashboard
  if (activeView === "dashboard") {
    if (userMgmt.isAuthenticated === false) {
      return (
        <LoginScreen
          loginUsername={userMgmt.loginUsername}
          setLoginUsername={userMgmt.setLoginUsername}
          loginPassword={userMgmt.loginPassword}
          setLoginPassword={userMgmt.setLoginPassword}
          loginError={userMgmt.loginError}
          title="Dashboard Executivo EUDR"
          eyebrow="FAF Coffees • Business Intelligence"
          subtitle="Informe suas credenciais para visualizar métricas, mapas e auditorias em tempo real."
          buttonText="Visualizar Dashboard ➔"
          userLabel="Usuário"
          passLabel="Senha"
          userPlaceholder="ex: admin"
          passPlaceholder="••••••••"
          backText="‹ Voltar ao Início"
          onLogin={async (e) => {
            if (e && typeof e.preventDefault === "function") e.preventDefault();
            const success = await userMgmt.handleLogin(e);
            if (success) setActiveView("dashboard");
          }}
          onBackToLanding={() => setActiveView("landing")}
        />
      );
    }
    return (
      <div
        style={{
          minHeight: "100vh",
          background:
            "radial-gradient(ellipse at 50% 0%, #102a20 0%, #081611 60%, #040c09 100%)",
        }}
      >
        <EudrHeader
          isAuthenticated={userMgmt.isAuthenticated || false}
          loggedUserRole={userMgmt.loggedUserRole}
          loggedUserKey={userMgmt.loggedUserKey}
          activeView="dashboard"
          onOpenLanding={() => setActiveView("landing")}
          onOpenPreparer={() => setActiveView("app")}
          onOpenDashboard={() => setActiveView("dashboard")}
          onOpenContracts={() => setActiveView("contratos")}
          onOpenAdminModal={() => userMgmt.setShowAdminModal(true)}
          onLogout={userMgmt.handleLogout}
          onNewProcess={handleNewProcessClick}
          onOpenLogsModal={() => setShowLogsModal(true)}
          onOpenCloudExplorer={() => setShowCloudExplorer(true)}
        />
        <ExecutiveDashboardView
          onNavigateToContracts={() => setActiveView("contratos")}
          onNavigateToPreparer={() => setActiveView("app")}
          onNavigateToCloud={() => {
            if (typeof window !== "undefined") {
              window.location.href = "/cloud";
            }
          }}
          userRole={userMgmt.loggedUserRole}
          userName={userMgmt.loggedUserName || userMgmt.loggedUserKey}
        />
      </div>
    );
  }

  // 3. Contratos
  if (activeView === "contratos") {
    if (userMgmt.isAuthenticated === false) {
      return (
        <LoginScreen
          loginUsername={userMgmt.loginUsername}
          setLoginUsername={userMgmt.setLoginUsername}
          loginPassword={userMgmt.loginPassword}
          setLoginPassword={userMgmt.setLoginPassword}
          loginError={userMgmt.loginError}
          title="Gestão de Contratos e Lotes"
          eyebrow="FAF Coffees • EUDR R2"
          subtitle="Informe suas credenciais de administrador ou operador para gerenciar contratos."
          buttonText="Acessar Contratos ➔"
          userLabel="Usuário"
          passLabel="Senha"
          userPlaceholder="ex: admin"
          passPlaceholder="••••••••"
          backText="‹ Voltar ao Início"
          onLogin={async (e) => {
            if (e && typeof e.preventDefault === "function") e.preventDefault();
            const success = await userMgmt.handleLogin(e);
            if (success) setActiveView("contratos");
          }}
          onBackToLanding={() => setActiveView("landing")}
        />
      );
    }
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-canvas)" }}>
        <EudrHeader
          isAuthenticated={true}
          loggedUserRole={userMgmt.loggedUserRole}
          loggedUserKey={userMgmt.loggedUserKey}
          activeView="contratos"
          onOpenLanding={() => setActiveView("landing")}
          onOpenPreparer={() => setActiveView("app")}
          onOpenDashboard={() => setActiveView("dashboard")}
          onOpenContracts={() => setActiveView("contratos")}
          onOpenAdminModal={() => userMgmt.setShowAdminModal(true)}
          onLogout={userMgmt.handleLogout}
          onNewProcess={handleNewProcessClick}
          onOpenLogsModal={() => setShowLogsModal(true)}
          onOpenCloudExplorer={() => setShowCloudExplorer(true)}
        />
        <ContractManagerView
          onOpenLanding={() => setActiveView("landing")}
          onOpenDashboard={() => setActiveView("dashboard")}
          loggedUserKey={userMgmt.loggedUserKey}
        />
      </div>
    );
  }

  // 4. Portal do Cliente
  if (activeView === "portal" || userMgmt.loggedUserRole === "client") {
    if (userMgmt.isAuthenticated === false) {
      return (
        <LoginScreen
          loginUsername={userMgmt.loginUsername}
          setLoginUsername={userMgmt.setLoginUsername}
          loginPassword={userMgmt.loginPassword}
          setLoginPassword={userMgmt.setLoginPassword}
          loginError={userMgmt.loginError}
          title="Portal do Cliente & Importador"
          eyebrow="FAF Coffees • EUDR R2 Storage"
          subtitle="Informe suas credenciais para visualizar e baixar arquivos GeoJSON dos seus contratos."
          buttonText="Acessar Portal ➔"
          userLabel="Usuário"
          passLabel="Senha"
          userPlaceholder="ex: cliente"
          passPlaceholder="••••••••"
          backText="‹ Voltar ao Início"
          onLogin={async (e) => {
            if (e && typeof e.preventDefault === "function") e.preventDefault();
            const success = await userMgmt.handleLogin(e);
            if (success) {
              setActiveView("portal");
            }
          }}
          onBackToLanding={() => setActiveView("landing")}
        />
      );
    }

    const currentFullName =
      userMgmt.loggedUserName ||
      (userMgmt.loggedUserKey
        ? userMgmt.usersMap[userMgmt.loggedUserKey]?.fullName
        : "") ||
      userMgmt.loggedUserKey;

    return (
      <ClientPortalModal
        isOpen={true}
        onClose={() => setActiveView("landing")}
        userName={currentFullName}
        loggedUserRole={userMgmt.loggedUserRole}
        loggedClientName={userMgmt.loggedClientName}
        onLogout={userMgmt.handleLogout}
      />
    );
  }

  // 5. Loading state
  if (userMgmt.isAuthenticated === null) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background:
            "radial-gradient(ellipse at 50% 0%, #102a20 0%, #081611 60%, #040c09 100%)",
          display: "grid",
          placeItems: "center",
        }}
      >
        <p style={{ color: "#34d399", fontWeight: 700, fontSize: "14px" }}>
          Carregando sistema FAF EUDR...
        </p>
      </div>
    );
  }

  // 6. Login (não autenticado)
  if (userMgmt.isAuthenticated === false) {
    return (
      <LoginScreen
        loginUsername={userMgmt.loginUsername}
        setLoginUsername={userMgmt.setLoginUsername}
        loginPassword={userMgmt.loginPassword}
        setLoginPassword={userMgmt.setLoginPassword}
        loginError={userMgmt.loginError}
        onLogin={async (e) => {
          if (e && typeof e.preventDefault === "function") e.preventDefault();
          const success = await userMgmt.handleLogin(e);
          if (success) {
            const role = sessionStorage.getItem("faf_eudr_user_role");
            if (role === "client") {
              setActiveView("portal");
            } else {
              setActiveView("app");
            }
          }
        }}
        onBackToLanding={() => setActiveView("landing")}
      />
    );
  }

  // 7. Workspace Principal (autenticado)
  return (
    <main className="app-shell">
      <EudrHeader
        isAuthenticated={true}
        loggedUserRole={userMgmt.loggedUserRole}
        loggedUserKey={userMgmt.loggedUserKey}
        activeView="app"
        onOpenLanding={() => setActiveView("landing")}
        onOpenPreparer={() => setActiveView("app")}
        onOpenDashboard={() => setActiveView("dashboard")}
        onOpenContracts={() => setActiveView("contratos")}
        onOpenAdminModal={() => userMgmt.setShowAdminModal(true)}
        onLogout={userMgmt.handleLogout}
        onNewProcess={handleNewProcessClick}
        onOpenLogsModal={() => setShowLogsModal(true)}
        onOpenCloudExplorer={() => setShowCloudExplorer(true)}
      />

      <section className="dashboard-head">
        <div className="hero-copy">
          <p className="section-kicker">Novo processo</p>
          <h2>Prepare um talhão para EUDR</h2>
          <p>
            Identifique a área, importe a geometria e valide a cobertura e
            conformidade no MapBiomas antes de gerar o pacote final.
          </p>
        </div>
        <div className="status-summary" aria-label="Resumo do processo">
          <div className={geometryExport.geometry ? "complete" : ""}>
            <span>Arquivo</span>
            <strong>{geometryExport.geometry ? "Carregado" : "Pendente"}</strong>
          </div>
          <div className={mb.mapbiomasCheck.checkedAt ? "complete" : ""}>
            <span>MapBiomas</span>
            <strong>
              {mb.mapbiomasCheck.checkedAt ? "Consultado" : "Pendente"}
            </strong>
          </div>
          <div className={ready ? "complete" : ""}>
            <span>Pacote EUDR</span>
            <strong>{ready ? "Pronto" : "Em preparo"}</strong>
          </div>
        </div>
      </section>

      <EudrStepsNav
        geometryLoaded={Boolean(geometryExport.geometry)}
        mapbiomasChecked={Boolean(mb.mapbiomasCheck.checkedAt)}
      />

      <section className="workspace-grid">
        <div className="main-column">
          <PlotIdentificationCard
            form={form}
            onUpdate={update}
            onNewProcess={handleNewProcessClick}
          />

          <GeometryImporter
            geometry={geometryExport.geometry}
            fileName={geometryExport.fileName}
            error={geometryExport.error}
            area={geometryExport.area}
            centerCoord={geometryExport.centerCoord}
            isDragging={isDragging}
            onFileSelected={handleFile}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          />

          <LocationComplianceCard
            form={form}
            locationsStatus={municipalities.locationsStatus}
            locationSuggestionsOpen={municipalities.locationSuggestionsOpen}
            municipalitySuggestions={municipalities.municipalitySuggestions}
            exactMunicipalities={municipalities.exactMunicipalities}
            mapbiomasCheck={mb.mapbiomasCheck}
            mapbiomasReady={mb.mapbiomasReady}
            onUpdate={update}
            onUpdateMunicipality={municipalities.updateMunicipality}
            onSelectMunicipalityState={municipalities.selectMunicipalityState}
            onSelectMunicipality={municipalities.selectMunicipality}
            onSetLocationSuggestionsOpen={municipalities.setLocationSuggestionsOpen}
            onRetryLocations={municipalities.retryLocations}
            onCheckMapbiomas={mb.checkMapbiomas}
          />
        </div>

        <aside>
          <HumanValidationCard
            carConfirmed={carConfirmed}
            onCarConfirmedChange={setCarConfirmed}
            mapbiomasConfirmed={mb.mapbiomasConfirmed}
            onMapbiomasConfirmedChange={mb.setMapbiomasConfirmed}
            mapbiomasCheck={mb.mapbiomasCheck}
          />

          <ExportCard
            normalizedId={normalizedId}
            geometryLoaded={Boolean(geometryExport.geometry)}
            ready={ready}
            isPublishingR2={r2.isPublishingR2}
            lastPublishedR2Key={r2.lastPublishedR2Key}
            onExportAll={geometryExport.exportAll}
            onDownloadGeoJson={geometryExport.downloadGeoJson}
            onDownloadShape={geometryExport.downloadShape}
            onDownloadXlsx={geometryExport.downloadXlsx}
            onPublishR2={r2.publishToCloudflareR2}
            onDownloadR2GeoJson={r2.handleDownloadR2GeoJsonDirect}
            onOpenDueDiligence={() => setShowDueDiligence(true)}
          />

          <article className="side-card note-card">
            <strong>Privacidade</strong>
            <p>
              Acesso restrito por credenciais. A consulta envia por HTTPS ao
              Global Forest Watch (GFW) uma cópia temporária da geometria para
              checagem da série temporal. Os arquivos permanecem salvos
              localmente.
            </p>
          </article>
        </aside>
      </section>

      {/* Modais */}
      <DueDiligenceReportModal
        isOpen={showDueDiligence}
        onClose={() => setShowDueDiligence(false)}
        form={form}
        geometry={geometryExport.geometry}
        verificationUrl={mb.mapbiomasCheck.verificationUrl}
      />

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <AdminUserModal
        showAdminModal={userMgmt.showAdminModal}
        setShowAdminModal={userMgmt.setShowAdminModal}
        loggedUserRole={userMgmt.loggedUserRole}
        loggedUserKey={userMgmt.loggedUserKey}
        usersMap={userMgmt.usersMap}
        newAdminUser={userMgmt.newAdminUser}
        setNewAdminUser={userMgmt.setNewAdminUser}
        newAdminPass={userMgmt.newAdminPass}
        setNewAdminPass={userMgmt.setNewAdminPass}
        newAdminFullName={userMgmt.newAdminFullName}
        setNewAdminFullName={userMgmt.setNewAdminFullName}
        newAdminRole={userMgmt.newAdminRole}
        setNewAdminRole={userMgmt.setNewAdminRole}
        newAdminClientName={userMgmt.newAdminClientName}
        setNewAdminClientName={userMgmt.setNewAdminClientName}
        adminErrorMsg={userMgmt.adminErrorMsg}
        adminSuccessMsg={userMgmt.adminSuccessMsg}
        onAddUser={userMgmt.handleAddUser}
        editingUser={userMgmt.editingUser}
        setEditingUser={userMgmt.setEditingUser}
        editUsernameInput={userMgmt.editUsernameInput}
        setEditUsernameInput={userMgmt.setEditUsernameInput}
        editFullNameInput={userMgmt.editFullNameInput}
        setEditFullNameInput={userMgmt.setEditFullNameInput}
        editRoleInput={userMgmt.editRoleInput}
        setEditRoleInput={userMgmt.setEditRoleInput}
        editClientNameInput={userMgmt.editClientNameInput}
        setEditClientNameInput={userMgmt.setEditClientNameInput}
        editNewPassInput={userMgmt.editNewPassInput}
        setEditNewPassInput={userMgmt.setEditNewPassInput}
        editingCurrentPassInput={userMgmt.editingCurrentPassInput}
        setEditingCurrentPassInput={userMgmt.setEditingCurrentPassInput}
        onStartEdit={userMgmt.handleStartEdit}
        onDeleteUser={userMgmt.handleDeleteUser}
        onAdminUpdateUser={userMgmt.handleAdminUpdateUser}
        onChangePassword={userMgmt.handleChangePassword}
      />

      <AuditLogModal
        isOpen={showLogsModal && userMgmt.loggedUserRole === "admin"}
        onClose={() => setShowLogsModal(false)}
      />

      <NewProcessModal
        isOpen={showNewProcessModal}
        onClose={() => setShowNewProcessModal(false)}
        onStartFromScratch={handleStartFromScratch}
        onNextPlotSameSupplier={handleNextPlotSameSupplier}
        currentPlotId={normalizedId || form.plotId}
        currentSupplier={form.supplier || form.producer}
        nextPlotIdPreview={nextPlotIdPreview}
      />

      <ServerStorageExplorer
        isOpen={showCloudExplorer}
        onClose={() => setShowCloudExplorer(false)}
        userName={userMgmt.loggedUserName || userMgmt.loggedUserKey}
        userRole={userMgmt.loggedUserRole}
      />
    </main>
  );
}
