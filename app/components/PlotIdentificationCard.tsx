"use client";

import type { FormState } from "../lib/types";
import { getTwoLetterInitials, generateAutoPlotId } from "../lib/eudr";
import { useTranslation } from "@/app/hooks/useTranslation";

type Props = {
  form: FormState;
  onUpdate: (field: keyof FormState, value: string) => void;
  onNewProcess: () => void;
};

export function PlotIdentificationCard({ form, onUpdate, onNewProcess }: Props) {
  const { locale, t } = useTranslation();

  const handleAutoGenerate = () => {
    let plotNumber = "01";
    const numberMatch = form.plotId.match(/-([0-9A-Z]+)$/i);
    if (numberMatch && numberMatch[1]) plotNumber = numberMatch[1];
    const generated = generateAutoPlotId(form.supplier || form.producer, form.municipality, plotNumber);
    if (generated) onUpdate("plotId", generated);
  };

  return (
    <article className="card">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "16px",
          marginBottom: "21px",
          paddingBottom: "18px",
          borderBottom: "1px solid #e8ede9",
        }}
      >
        <div
          className="card-title"
          style={{ marginBottom: 0, paddingBottom: 0, borderBottom: 0 }}
        >
          <span>01</span>
          <div>
            <h3>{locale === "en" ? "Farm Plot Identification" : "Identificação do talhão"}</h3>
            <p>{locale === "en" ? "Use the standardized EUDR plot format." : "Use o mesmo padrão adotado no procedimento."}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onNewProcess}
          style={{
            border: "1px solid var(--border-strong)",
            borderRadius: "999px",
            background: "var(--bg-subtle)",
            color: "var(--text-primary)",
            padding: "6px 14px",
            fontSize: "12px",
            fontWeight: 650,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            boxShadow: "var(--shadow-subtle)",
            transition: "all 0.16s ease",
          }}
          title={locale === "en" ? "Clear all fields and start a new plot" : "Limpar todos os campos e iniciar novo talhão"}
        >
          <span>↺</span> {locale === "en" ? "Start New Process" : "Iniciar Novo Processo"}
        </button>
      </div>

      <div className="form-grid three">
        <label>
          {locale === "en" ? "Plot ID (EUDR Code) *" : "Código do talhão *"}
          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            <input
              value={form.plotId}
              onChange={(e) => onUpdate("plotId", e.target.value.toUpperCase())}
              placeholder="Ex.: FAFDRAD-01"
              style={{ flex: 1 }}
            />
            <button
              type="button"
              onClick={handleAutoGenerate}
              title={locale === "en" ? "Auto-generate code (FAF + Supplier + Municipality + N°)" : "Gerar código automaticamente (FAF + Fornecedor + Município + N°)"}
              style={{
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1px solid var(--border-strong)",
                background: "var(--bg-subtle)",
                color: "var(--text-primary)",
                fontWeight: 700,
                fontSize: "11.5px",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              ⚡ {locale === "en" ? "Auto-generate" : "Auto-gerar"}
            </button>
          </div>
          <small>
            FAF + {locale === "en" ? "supplier (" : "fornecedor ("}
            {getTwoLetterInitials(form.supplier || form.producer) || "XX"}) +
            {locale === "en" ? " municipality (" : " município ("}
            {getTwoLetterInitials(form.municipality) || "XX"}) +
            {locale === "en" ? " number (-01)" : " número (-01)"}
          </small>
        </label>

        <label>
          {locale === "en" ? "Supplier / Cooperative *" : "Fornecedor *"}
          <input
            value={form.supplier}
            onChange={(e) => onUpdate("supplier", e.target.value)}
            placeholder="Ex.: Drumond"
          />
        </label>

        <label>
          {locale === "en" ? "CAR Registry Code" : "Número do CAR"}
          <input
            value={form.car}
            onChange={(e) => onUpdate("car", e.target.value)}
            placeholder={locale === "en" ? "CAR Registration Code" : "Registro no CAR"}
          />
        </label>

        <label>
          {locale === "en" ? "Farm Name" : "Nome da fazenda"}
          <input
            value={form.farm}
            onChange={(e) => onUpdate("farm", e.target.value)}
            placeholder={locale === "en" ? "N/A if not provided" : "NA se não informado"}
          />
        </label>

        <label>
          {locale === "en" ? "Farmer / Producer Name" : "Nome do produtor"}
          <input
            value={form.producer}
            onChange={(e) => onUpdate("producer", e.target.value)}
            placeholder={locale === "en" ? "N/A if not provided" : "NA se não informado"}
          />
        </label>

        <label>
          {locale === "en" ? "Mapped by (Agronomist) * 🔒" : "Responsável pelo mapeamento * 🔒"}
          <input
            value={form.mappedBy}
            readOnly
            disabled
            style={{
              background: "var(--bg-subtle)",
              color: "var(--text-muted)",
              fontWeight: 650,
              cursor: "not-allowed",
            }}
          />
          <small style={{ color: "var(--text-muted)" }}>
            {locale === "en" ? "Assigned by your login profile." : "Definido pelo seu perfil de login."}
          </small>
        </label>
      </div>
    </article>
  );
}
