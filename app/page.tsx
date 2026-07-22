"use client";

import { ChangeEvent, useMemo, useRef, useState } from "react";
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

const today = new Date().toISOString().slice(0, 10);

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

function GeometryPreview({ geometry }: { geometry: GeometryData }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = (canvas: HTMLCanvasElement | null) => {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const points = geometry.polygons.flat(2);
    const xs = points.map((point) => point[0]);
    const ys = points.map((point) => point[1]);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const spanX = Math.max(maxX - minX, 0.000001);
    const spanY = Math.max(maxY - minY, 0.000001);
    const scale = Math.min((width - 56) / spanX, (height - 56) / spanY);
    const offsetX = (width - spanX * scale) / 2;
    const offsetY = (height - spanY * scale) / 2;

    ctx.fillStyle = "#f3f6ee";
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = "rgba(29, 57, 43, 0.08)";
    ctx.lineWidth = 1;
    for (let x = 24; x < width; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 24; y < height; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    geometry.polygons.forEach((polygon) => {
      ctx.beginPath();
      polygon.forEach((ring) => {
        ring.forEach(([x, y], index) => {
          const px = offsetX + (x - minX) * scale;
          const py = height - (offsetY + (y - minY) * scale);
          if (index === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.closePath();
      });
      ctx.fillStyle = "rgba(190, 92, 46, 0.22)";
      ctx.strokeStyle = "#bd5c2e";
      ctx.lineWidth = 2.5;
      ctx.fill("evenodd");
      ctx.stroke();
    });
  };

  return (
    <canvas
      aria-label="Prévia do polígono"
      className="geometry-canvas"
      height={320}
      ref={(node) => {
        canvasRef.current = node;
        draw(node);
      }}
      width={560}
    />
  );
}

export default function Home() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [geometry, setGeometry] = useState<GeometryData | null>(null);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [carConfirmed, setCarConfirmed] = useState(false);
  const [mapbiomasConfirmed, setMapbiomasConfirmed] = useState(false);

  const area = useMemo(
    () => (geometry ? calculateAreaHectares(geometry) : 0),
    [geometry],
  );
  const normalizedId = sanitizePlotId(form.plotId);
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

  const update = (field: keyof FormState, value: string) =>
    setForm((current) => ({ ...current, [field]: value }));

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError("");
    try {
      const parsed = await parseGeometryFile(file);
      setGeometry(parsed);
      setFileName(file.name);
    } catch (problem) {
      setGeometry(null);
      setFileName("");
      setError(problem instanceof Error ? problem.message : "Não foi possível ler o arquivo.");
    }
  };

  const downloadGeoJson = () => {
    if (!geometry || !normalizedId) return;
    const content = JSON.stringify(buildEudrGeoJson(geometry, normalizedId, area), null, 2);
    downloadBlob(`${normalizedId}.geojson`, new Blob([content], { type: "application/geo+json" }));
  };

  const downloadShape = () => {
    if (!geometry || !normalizedId) return;
    downloadBlob(`${normalizedId}-shapefile.zip`, buildShapefileZip(geometry, normalizedId, area));
  };

  const downloadCsv = () => {
    if (!normalizedId) return;
    const content = producerCsv({ ...form, plotId: normalizedId, area });
    downloadBlob(`${normalizedId}-cadastro.csv`, new Blob([content], { type: "text/csv;charset=utf-8" }));
  };

  const exportAll = () => {
    downloadGeoJson();
    window.setTimeout(downloadShape, 250);
    window.setTimeout(downloadCsv, 500);
  };

  return (
    <main>
      <header className="topbar">
        <div className="brand-mark">FAF</div>
        <div>
          <p className="eyebrow">FAF Coffees · Sustentabilidade</p>
          <h1>Preparador EUDR</h1>
        </div>
        <div className="privacy-pill"><span /> Processamento local</div>
      </header>

      <section className="hero">
        <div>
          <p className="section-kicker">Novo talhão</p>
          <h2>Do polígono aos arquivos EUDR, em poucos passos.</h2>
          <p>Importe o KML, confira os dados e gere os arquivos padronizados sem editar JSON manualmente.</p>
        </div>
        <div className="hero-number"><strong>{geometry ? "01" : "00"}</strong><span>geometrias carregadas</span></div>
      </section>

      <nav className="steps" aria-label="Etapas do processo">
        <span className="active">1 <b>Identificação</b></span>
        <span className={geometry ? "active" : ""}>2 <b>Geometria</b></span>
        <span className={form.compliance ? "active" : ""}>3 <b>Conformidade</b></span>
        <span className={ready ? "active" : ""}>4 <b>Exportação</b></span>
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
                <GeometryPreview geometry={geometry} />
                <div className="metrics">
                  <div><span>Área calculada</span><strong>{area.toLocaleString("pt-BR", { maximumFractionDigits: 4 })} ha</strong></div>
                  <div><span>Polígonos</span><strong>{geometry.polygons.length}</strong></div>
                  <div><span>Sistema</span><strong>WGS 84</strong></div>
                  <p>✓ Geometria fechada e pronta para exportação.</p>
                </div>
              </div>
            )}
          </article>

          <article className="card">
            <div className="card-title"><span>03</span><div><h3>Localização e conformidade</h3><p>Registre a checagem feita no MapBiomas.</p></div></div>
            <div className="form-grid three">
              <label>Região<input value={form.region} onChange={(e) => update("region", e.target.value)} placeholder="Ex.: Sul de Minas" /></label>
              <label>Município *<input value={form.municipality} onChange={(e) => update("municipality", e.target.value)} placeholder="Ex.: Andradas" /></label>
              <label>Estado *<input value={form.state} onChange={(e) => update("state", e.target.value)} placeholder="Ex.: Minas Gerais" /></label>
              <label>Data do mapeamento<input type="date" value={form.mappedAt} onChange={(e) => update("mappedAt", e.target.value)} /></label>
              <label>Data da verificação<input type="date" value={form.checkedAt} onChange={(e) => update("checkedAt", e.target.value)} /></label>
              <label>Resultado *<select value={form.compliance} onChange={(e) => update("compliance", e.target.value)}><option value="">Selecione</option><option>Em conformidade</option><option>Não conforme</option><option>Revisão necessária</option></select></label>
            </div>
            <label>Observações<textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} placeholder="Registre evidências, ressalvas ou pendências." /></label>
          </article>
        </div>

        <aside>
          <article className="side-card checklist-card">
            <p className="section-kicker">Controles obrigatórios</p>
            <h3>Validação humana</h3>
            <label className="check-row"><input type="checkbox" checked={carConfirmed} onChange={(e) => setCarConfirmed(e.target.checked)} /><span><strong>CAR conferido</strong><small>Registro localizado e KML correto.</small></span></label>
            <a className="text-link" href="https://www.registrorural.com.br/" target="_blank" rel="noreferrer">Abrir Registro Rural ↗</a>
            <label className="check-row"><input type="checkbox" checked={mapbiomasConfirmed} onChange={(e) => setMapbiomasConfirmed(e.target.checked)} /><span><strong>MapBiomas conferido</strong><small>Formação florestal analisada desde 2020.</small></span></label>
            <a className="text-link" href="https://brasil.mapbiomas.org/" target="_blank" rel="noreferrer">Abrir MapBiomas ↗</a>
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

          <article className="side-card note-card"><strong>Privacidade</strong><p>Nenhum arquivo ou dado é enviado para um servidor. Todo o processamento acontece no seu navegador.</p></article>
        </aside>
      </section>
    </main>
  );
}
