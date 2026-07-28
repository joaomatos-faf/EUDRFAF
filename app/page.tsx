"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import {
  GeometryData,
  buildEudrGeoJson,
  buildShapefileZip,
  calculateAreaHectares,
  downloadBlob,
  parseGeometryFile,
  producerCsv,
  sanitizePlotId,
} from "./lib/eudr";

type FormState = {
  plotId: string;
  farm: string;
  producer: string;
  supplier: string;
  region: string;
  municipality: string;
  state: string;
  mappedAt: string;
  checkedAt: string;
  compliance: string;
  notes: string;
  mappedBy: string;
  car: string;
};

type Municipality = {
  id: number;
  name: string;
  stateCode: string;
  stateName: string;
  region: string;
};

type IbgeMunicipality = {
  "municipio-id"?: number;
  "municipio-nome"?: string;
  "UF-sigla"?: string;
  "UF-nome"?: string;
  "regiao-nome"?: string;
};

type MapbiomasCheck = {
  status: "idle" | "loading" | "clear" | "attention" | "error";
  areaHa: number;
  checkedAt: string;
  message: string;
  verificationUrl: string;
  changes: Array<{
    fromYear: number;
    toYear: number;
    className: string;
    fromHa: number;
    toHa: number;
  }>;
};

const emptyMapbiomasCheck: MapbiomasCheck = {
  status: "idle",
  areaHa: 0,
  checkedAt: "",
  message: "",
  verificationUrl: "",
  changes: [],
};

const today = new Date().toISOString().slice(0, 10);
const shapefileDetailFields = new Set<keyof FormState>([
  "plotId", "farm", "producer", "supplier", "region", "municipality", "state",
  "mappedAt", "mappedBy", "car",
]);

const initialForm: FormState = {
  plotId: "",
  farm: "",
  producer: "",
  supplier: "",
  region: "",
  municipality: "",
  state: "",
  mappedAt: today,
  checkedAt: today,
  compliance: "",
  notes: "",
  mappedBy: "",
  car: "",
};

function normalizedText(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR").trim();
}

// O Leaflet interage com window, então carregamos o componente Map dinamicamente (para SSR)
const MapPreviewComponent = dynamic(() => import("./MapPreviewComponent"), { 
  ssr: false, 
  loading: () => <div style={{ width: 560, height: 320, background: "#f3f6ee", borderRadius: 8 }} />
});

function MapPreview({ geometry }: { geometry: GeometryData }) {
  return <MapPreviewComponent geometry={geometry} />;
}

export default function Home() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [geometry, setGeometry] = useState<GeometryData | null>(null);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [carConfirmed, setCarConfirmed] = useState(false);
  const [mapbiomasConfirmed, setMapbiomasConfirmed] = useState(false);
  const [mapbiomasCheck, setMapbiomasCheck] = useState<MapbiomasCheck>(emptyMapbiomasCheck);
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [locationsStatus, setLocationsStatus] = useState<"loading" | "ready" | "error">("loading");
  const [locationSuggestionsOpen, setLocationSuggestionsOpen] = useState(false);
  const [locationsReload, setLocationsReload] = useState(0);

  useEffect(() => {
    let active = true;
    setLocationsStatus("loading");
    const loadMunicipalities = async () => {
      try {
        const response = await fetch("/api/locations/municipalities");
        const result = await response.json() as { municipalities?: Municipality[]; error?: string };
        if (!response.ok || !result.municipalities?.length) throw new Error(result.error);
        return result.municipalities;
      } catch {
        const response = await fetch(
          "https://servicodados.ibge.gov.br/api/v1/localidades/municipios?view=nivelado&orderBy=nome",
        );
        if (!response.ok) throw new Error("IBGE indisponível");
        const data = await response.json() as IbgeMunicipality[];
        return data
          .filter((item) => item["municipio-id"] && item["municipio-nome"] && item["UF-sigla"])
          .map((item) => ({
            id: Number(item["municipio-id"]),
            name: String(item["municipio-nome"]),
            stateCode: String(item["UF-sigla"]),
            stateName: String(item["UF-nome"] ?? item["UF-sigla"]),
            region: String(item["regiao-nome"] ?? ""),
          }));
      }
    };
    loadMunicipalities()
      .then((items) => {
        if (!active) return;
        setMunicipalities(items);
        setLocationsStatus("ready");
      })
      .catch(() => {
        if (active) setLocationsStatus("error");
      });
    return () => { active = false; };
  }, [locationsReload]);

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
    return { lng: (Math.min(...xs) + Math.max(...xs)) / 2, lat: (Math.min(...ys) + Math.max(...ys)) / 2 };
  }, [geometry]);
  const normalizedId = sanitizePlotId(form.plotId);
  const exactMunicipalities = useMemo(() => {
    const query = normalizedText(form.municipality);
    if (!query) return [];
    return municipalities.filter((municipality) => normalizedText(municipality.name) === query);
  }, [form.municipality, municipalities]);
  const municipalitySuggestions = useMemo(() => {
    const query = normalizedText(form.municipality);
    if (query.length < 2) return [];
    const startsWith = municipalities.filter((item) => normalizedText(item.name).startsWith(query));
    const contains = municipalities.filter((item) => {
      const name = normalizedText(item.name);
      return !name.startsWith(query) && name.includes(query);
    });
    return [...startsWith, ...contains].slice(0, 60);
  }, [form.municipality, municipalities]);

  useEffect(() => {
    if (locationsStatus !== "ready" || exactMunicipalities.length !== 1) return;
    const selected = exactMunicipalities[0];
    setForm((current) => {
      if (current.state || current.region) return current;
      return {
        ...current,
        municipality: selected.name,
        state: selected.stateName,
        region: selected.region,
      };
    });
  }, [exactMunicipalities, locationsStatus]);
  const mapbiomasReady = Boolean(
    geometry &&
      normalizedId &&
      form.supplier.trim() &&
      form.municipality.trim() &&
      form.state.trim() &&
      form.mappedBy.trim(),
  );
  const ready = Boolean(
    geometry &&
      normalizedId &&
      form.supplier.trim() &&
      form.municipality.trim() &&
      form.state.trim() &&
      form.compliance &&
      form.mappedBy.trim() &&
      carConfirmed &&
      mapbiomasConfirmed,
  );

  const update = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    if (shapefileDetailFields.has(field) && mapbiomasCheck.checkedAt) {
      setMapbiomasCheck(emptyMapbiomasCheck);
      setMapbiomasConfirmed(false);
    }
  };

  const updateMunicipality = (value: string) => {
    const query = normalizedText(value);
    const exact = municipalities.filter((municipality) => normalizedText(municipality.name) === query);
    const selected = exact.length === 1 ? exact[0] : null;
    setForm((current) => ({
      ...current,
      municipality: selected?.name ?? value,
      state: selected?.stateName ?? "",
      region: selected?.region ?? "",
    }));
    if (mapbiomasCheck.checkedAt) {
      setMapbiomasCheck(emptyMapbiomasCheck);
      setMapbiomasConfirmed(false);
    }
  };

  const selectMunicipalityState = (stateCode: string) => {
    const selected = exactMunicipalities.find((municipality) => municipality.stateCode === stateCode);
    if (!selected) return;
    setForm((current) => ({
      ...current,
      municipality: selected.name,
      state: selected.stateName,
      region: selected.region,
    }));
    if (mapbiomasCheck.checkedAt) {
      setMapbiomasCheck(emptyMapbiomasCheck);
      setMapbiomasConfirmed(false);
    }
  };

  const selectMunicipality = (selected: Municipality) => {
    setForm((current) => ({
      ...current,
      municipality: selected.name,
      state: selected.stateName,
      region: selected.region,
    }));
    setLocationSuggestionsOpen(false);
    if (mapbiomasCheck.checkedAt) {
      setMapbiomasCheck(emptyMapbiomasCheck);
      setMapbiomasConfirmed(false);
    }
  };

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError("");
    try {
      const parsed = await parseGeometryFile(file);
      setGeometry(parsed);
      setFileName(file.name);
      setMapbiomasCheck(emptyMapbiomasCheck);
      setMapbiomasConfirmed(false);
    } catch (problem) {
      setGeometry(null);
      setFileName("");
      setError(problem instanceof Error ? problem.message : "Não foi possível ler o arquivo.");
    }
  };

  const checkMapbiomas = async () => {
    if (!geometry) return;
    setMapbiomasConfirmed(false);
    setMapbiomasCheck({ ...emptyMapbiomasCheck, status: "loading" });
    try {
      const response = await fetch("/api/mapbiomas/check", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          geometry,
          details: { ...form, plotId: normalizedId, checkedAt: today },
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
      const mappedArea = result.areaHa ?? 0;
      setMapbiomasCheck({
        status: result.hasChanges ? "attention" : "clear",
        areaHa: mappedArea,
        checkedAt: result.checkedAt ?? new Date().toISOString(),
        message: "",
        verificationUrl: result.verificationUrl ?? "",
        changes: result.changes ?? [],
      });
      update("checkedAt", today);
    } catch (problem) {
      setMapbiomasCheck({
        ...emptyMapbiomasCheck,
        status: "error",
        message: problem instanceof Error ? problem.message : "Não foi possível consultar o MapBiomas.",
      });
    }
  };

  const downloadGeoJson = () => {
    if (!geometry || !normalizedId) return;
    const content = JSON.stringify(buildEudrGeoJson(geometry, normalizedId, area), null, 2);
    downloadBlob(`${normalizedId}.geojson`, new Blob([content], { type: "application/geo+json" }));
  };

  const downloadShape = () => {
    if (!geometry || !normalizedId) return;
    downloadBlob(`${normalizedId}-shapefile.zip`, buildShapefileZip(geometry, normalizedId, area, form));
  };

  const downloadCsv = () => {
    if (!normalizedId) return;
    const automaticNote = mapbiomasCheck.checkedAt
      ? `MapBiomas Série temporal de Cobertura por classe, Coleção 10.1 (${new Date(mapbiomasCheck.checkedAt).toLocaleString("pt-BR")}): ${mapbiomasCheck.changes.length ? `${mapbiomasCheck.changes.length} alteração(ões) entre classes/anos de 2020 a 2024` : "nenhuma alteração entre 2020 e 2024"}.${mapbiomasCheck.verificationUrl ? ` Verificação: ${mapbiomasCheck.verificationUrl}.` : ""}`
      : "MapBiomas Série temporal de Cobertura: consulta automática não realizada.";
    const notes = [form.notes.trim(), automaticNote].filter(Boolean).join(" ");
    const content = producerCsv({ ...form, notes, plotId: normalizedId, area });
    downloadBlob(`${normalizedId}-cadastro.csv`, new Blob([content], { type: "text/csv;charset=utf-8" }));
  };

  const exportAll = () => {
    downloadGeoJson();
    window.setTimeout(downloadShape, 250);
    window.setTimeout(downloadCsv, 500);
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <div className="brand-mark">FAF</div>
          <div>
            <p className="eyebrow">FAF Coffees · Sustentabilidade</p>
            <h1>Preparador EUDR</h1>
          </div>
        </div>
        <div className="topbar-actions">
          <div className="privacy-pill"><span /> Dados locais e consulta segura</div>
        </div>
      </header>

      <section className="dashboard-head">
        <div className="hero-copy">
          <p className="section-kicker">Novo processo</p>
          <h2>Prepare um talhão para EUDR</h2>
          <p>Identifique a área, importe a geometria e valide a série temporal do MapBiomas antes de gerar o pacote final.</p>
        </div>
        <div className="status-summary" aria-label="Resumo do processo">
          <div className={geometry ? "complete" : ""}><span>Arquivo</span><strong>{geometry ? "Carregado" : "Pendente"}</strong></div>
          <div className={mapbiomasCheck.checkedAt ? "complete" : ""}><span>MapBiomas</span><strong>{mapbiomasCheck.checkedAt ? "Consultado" : "Pendente"}</strong></div>
          <div className={ready ? "complete" : ""}><span>Pacote EUDR</span><strong>{ready ? "Pronto" : "Em preparo"}</strong></div>
        </div>
      </section>

      <nav className="steps" aria-label="Etapas do processo">
        <span className="active"><i>1</i><b>Identificação</b><small>Dados do talhão</small></span>
        <span className={geometry ? "active" : ""}><i>2</i><b>Geometria</b><small>KML ou GeoJSON</small></span>
        <span className={form.compliance ? "active" : ""}><i>3</i><b>Conformidade</b><small>MapBiomas e CAR</small></span>
        <span className={ready ? "active" : ""}><i>4</i><b>Exportação</b><small>Arquivos finais</small></span>
      </nav>

      <section className="workspace-grid">
        <div className="main-column">
          <article className="card">
            <div className="card-title"><span>01</span><div><h3>Identificação do talhão</h3><p>Use o mesmo padrão adotado no procedimento.</p></div></div>
            <div className="form-grid three">
              <label>Código do talhão *<input value={form.plotId} onChange={(e) => update("plotId", e.target.value.toUpperCase())} placeholder="Ex.: FAFDRAD-01" /><small>FAF + fornecedor + município + número</small></label>
              <label>Fornecedor *<input value={form.supplier} onChange={(e) => update("supplier", e.target.value)} placeholder="Ex.: Drumond" /></label>
              <label>Número do CAR<input value={form.car} onChange={(e) => update("car", e.target.value)} placeholder="Registro no CAR" /></label>
              <label>Nome da fazenda<input value={form.farm} onChange={(e) => update("farm", e.target.value)} placeholder="NA se não informado" /></label>
              <label>Nome do produtor<input value={form.producer} onChange={(e) => update("producer", e.target.value)} placeholder="NA se não informado" /></label>
              <label>Responsável pelo mapeamento *<input value={form.mappedBy} onChange={(e) => update("mappedBy", e.target.value)} placeholder="Nome completo" /></label>
            </div>
          </article>

          <article className="card">
            <div className="card-title"><span>02</span><div><h3>Geometria da área</h3><p>A área em hectares é calculada automaticamente.</p></div></div>
            <label className={`dropzone ${geometry ? "loaded" : ""}`}>
              <input type="file" accept=".kml,.geojson,.json" onChange={handleFile} />
              <span className="upload-icon">↥</span>
              <strong>{fileName || "Selecionar arquivo KML ou GeoJSON"}</strong>
              <small>{geometry ? "Arquivo validado. Clique para substituir." : "O arquivo permanece somente neste navegador."}</small>
            </label>
            {error && <p className="error-box">{error}</p>}
            {geometry && (
              <div className="geometry-result">
                <MapPreview geometry={geometry} />
                <div className="metrics">
                  <div><span>Área calculada</span><strong>{area.toLocaleString("pt-BR", { maximumFractionDigits: 4 })} ha</strong></div>
                  <div><span>Polígonos</span><strong>{geometry.polygons.length}</strong></div>
                  <div><span>Sistema</span><strong>WGS 84</strong></div>
                  <p>✓ Geometria fechada e pronta para exportação.</p>
                  {centerCoord && <a className="text-link" style={{marginTop: "8px", display: "inline-block"}} href={`https://www.google.com/maps/search/?api=1&query=${centerCoord.lat},${centerCoord.lng}`} target="_blank" rel="noreferrer">Visualizar no Google Maps ↗</a>}
                </div>
              </div>
            )}
          </article>

          <article className="card">
            <div className="card-title"><span>03</span><div><h3>Localização e conformidade</h3><p>Compare automaticamente a série temporal de cobertura por classe no MapBiomas.</p></div></div>
            <div className="form-grid three">
              <label>Região<input value={form.region} onChange={(e) => update("region", e.target.value)} placeholder={locationsStatus === "loading" ? "Carregando…" : "Preenchida automaticamente"} /><small>Preenchida automaticamente pelo município; você pode alterar se necessário.</small></label>
              <div className="location-field"><label htmlFor="municipality">Município *</label><input id="municipality" autoComplete="off" role="combobox" aria-autocomplete="list" aria-expanded={locationSuggestionsOpen && municipalitySuggestions.length > 0} value={form.municipality} onFocus={() => setLocationSuggestionsOpen(true)} onBlur={() => window.setTimeout(() => setLocationSuggestionsOpen(false), 120)} onChange={(e) => { updateMunicipality(e.target.value); setLocationSuggestionsOpen(true); }} placeholder="Digite e selecione o município" />{locationSuggestionsOpen && municipalitySuggestions.length > 0 && <div className="municipality-suggestions" role="listbox">{municipalitySuggestions.map((municipality) => <button type="button" role="option" key={municipality.id} onMouseDown={(event) => event.preventDefault()} onClick={() => selectMunicipality(municipality)}><strong>{municipality.name}</strong><span>{municipality.stateCode} · {municipality.stateName}</span></button>)}</div>}<small>{locationsStatus === "loading" ? "Carregando lista oficial do IBGE…" : locationsStatus === "error" ? <>Não foi possível carregar os municípios. <button type="button" className="location-retry" onClick={() => setLocationsReload((value) => value + 1)}>Tentar novamente</button></> : "Digite ao menos duas letras e clique em uma opção."}</small></div>
              {exactMunicipalities.length > 1 && locationsStatus === "ready" ? <label>Estado *<select value={exactMunicipalities.find((item) => item.stateName === form.state)?.stateCode ?? ""} onChange={(e) => selectMunicipalityState(e.target.value)}><option value="">Selecione o estado</option>{exactMunicipalities.map((municipality) => <option key={municipality.id} value={municipality.stateCode}>{municipality.stateName} ({municipality.stateCode})</option>)}</select><small>Este nome de município existe em mais de um estado.</small></label> : <label>Estado *<input value={form.state} readOnly={locationsStatus !== "error"} onChange={(e) => update("state", e.target.value)} placeholder={locationsStatus === "loading" ? "Carregando…" : "Preenchido automaticamente"} /></label>}
              <label>Data do mapeamento<input type="date" value={form.mappedAt} onChange={(e) => update("mappedAt", e.target.value)} /></label>
              <label>Data da verificação<input type="date" value={form.checkedAt} onChange={(e) => update("checkedAt", e.target.value)} /></label>
              <label>Resultado *<select value={form.compliance} onChange={(e) => update("compliance", e.target.value)}><option value="">Selecione</option><option>Em conformidade</option><option>Não conforme</option><option>Revisão necessária</option></select></label>
            </div>
            <div className="mapbiomas-panel">
              <div>
                <strong>MapBiomas Cobertura · série temporal 2020–2024</strong>
                <p>O KML é convertido em Shapefile e as áreas de todas as classes são comparadas ano a ano, com duas casas decimais, como na tabela do MapBiomas.</p>
                {!mapbiomasReady && <small className="mapbiomas-prerequisite">Preencha código do talhão, fornecedor, município, estado e responsável pelo mapeamento.</small>}
              </div>
              <button className="secondary-button" disabled={!mapbiomasReady || mapbiomasCheck.status === "loading"} onClick={checkMapbiomas}>
                {mapbiomasCheck.status === "loading" ? "Consultando…" : mapbiomasCheck.checkedAt ? "Consultar novamente" : "Consultar MapBiomas"}
              </button>
            </div>
            {mapbiomasCheck.status !== "idle" && mapbiomasCheck.status !== "loading" && (
              <div className={`mapbiomas-result ${mapbiomasCheck.status}`}>
                {mapbiomasCheck.status === "clear" && <><strong>✓ Cobertura sem alteração de 2020 a 2024</strong><p>Todas as classes mantiveram os mesmos valores na precisão exibida pela tabela do MapBiomas.</p></>}
                {mapbiomasCheck.status === "attention" && <><strong>! Alteração de cobertura encontrada</strong><p>Revise as mudanças abaixo na tabela da série temporal do MapBiomas.</p><ul className="coverage-changes">{mapbiomasCheck.changes.slice(0, 8).map((change, index) => <li key={`${change.fromYear}-${change.toYear}-${change.className}-${index}`}><b>{change.fromYear}→{change.toYear}</b> · {change.className}: {change.fromHa.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} → {change.toHa.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ha</li>)}{mapbiomasCheck.changes.length > 8 && <li>Mais {mapbiomasCheck.changes.length - 8} alteração(ões). Consulte a tabela completa no link.</li>}</ul></>}
                {mapbiomasCheck.status === "error" && <><strong>Não foi possível concluir a consulta</strong><p>{mapbiomasCheck.message}</p></>}
                {mapbiomasCheck.verificationUrl && <a className="verification-link" href={mapbiomasCheck.verificationUrl} target="_blank" rel="noreferrer">Abrir geometria e cobertura no MapBiomas ↗</a>}
              </div>
            )}
            <label>Observações<textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} placeholder="Registre evidências, ressalvas ou pendências." /></label>
          </article>
        </div>

        <aside>
          <article className="side-card checklist-card">
            <p className="section-kicker">Controles obrigatórios</p>
            <h3>Validação humana</h3>
            <label className="check-row"><input type="checkbox" checked={carConfirmed} onChange={(e) => setCarConfirmed(e.target.checked)} /><span><strong>CAR conferido</strong><small>Registro localizado e KML correto.</small></span></label>
            <a className="text-link" href="https://www.registrorural.com.br/" target="_blank" rel="noreferrer">Abrir Registro Rural ↗</a>
            <label className="check-row"><input type="checkbox" disabled={!mapbiomasCheck.checkedAt} checked={mapbiomasConfirmed} onChange={(e) => setMapbiomasConfirmed(e.target.checked)} /><span><strong>Resultado MapBiomas revisado</strong><small>{mapbiomasCheck.checkedAt ? "Confirme após interpretar a consulta automática." : "Faça a consulta automática antes de confirmar."}</small></span></label>
            {mapbiomasCheck.verificationUrl && <a className="text-link" href={mapbiomasCheck.verificationUrl} target="_blank" rel="noreferrer">Abrir geometria e cobertura no MapBiomas ↗</a>}
          </article>

          <article className="side-card export-card">
            <p className="section-kicker">Pacote final</p>
            <h3>{normalizedId || "Código pendente"}</h3>
            <ul>
              <li><span>GeoJSON EUDR</span><b>{geometry && normalizedId ? "Pronto" : "Pendente"}</b></li>
              <li><span>Shapefile (.zip)</span><b>{geometry && normalizedId ? "Pronto" : "Pendente"}</b></li>
              <li><span>Linha da planilha</span><b>{normalizedId ? "Pronta" : "Pendente"}</b></li>
            </ul>
            <button className="primary-button" disabled={!ready} onClick={exportAll}>Baixar pacote EUDR</button>
            {!ready && <p className="hint">Preencha os campos com * e confirme os dois controles.</p>}
            <div className="individual-actions">
              <button disabled={!geometry || !normalizedId} onClick={downloadGeoJson}>GeoJSON</button>
              <button disabled={!geometry || !normalizedId} onClick={downloadShape}>Shapefile</button>
              <button disabled={!normalizedId} onClick={downloadCsv}>Planilha</button>
            </div>
          </article>

          <article className="side-card note-card"><strong>Privacidade</strong><p>Não há login nem senha. A consulta envia por HTTPS ao MapBiomas uma cópia temporária do Shapefile com a geometria e os dados preenchidos. O KML original permanece no PC.</p></article>
        </aside>
      </section>
    </main>
  );
}
