"use client";

import type { FormState, MapbiomasCheck, Municipality } from "../lib/types";

type Props = {
  form: FormState;
  locationsStatus: "loading" | "ready" | "error";
  locationSuggestionsOpen: boolean;
  municipalitySuggestions: Municipality[];
  exactMunicipalities: Municipality[];
  mapbiomasCheck: MapbiomasCheck;
  mapbiomasReady: boolean;
  onUpdate: (field: keyof FormState, value: string) => void;
  onUpdateMunicipality: (value: string) => void;
  onSelectMunicipalityState: (stateCode: string) => void;
  onSelectMunicipality: (municipality: Municipality) => void;
  onSetLocationSuggestionsOpen: (open: boolean) => void;
  onRetryLocations: () => void;
  onCheckMapbiomas: () => void;
};

export function LocationComplianceCard({
  form,
  locationsStatus,
  locationSuggestionsOpen,
  municipalitySuggestions,
  exactMunicipalities,
  mapbiomasCheck,
  mapbiomasReady,
  onUpdate,
  onUpdateMunicipality,
  onSelectMunicipalityState,
  onSelectMunicipality,
  onSetLocationSuggestionsOpen,
  onRetryLocations,
  onCheckMapbiomas,
}: Props) {
  return (
    <article className="card">
      <div className="card-title">
        <span>03</span>
        <div>
          <h3>Localização e conformidade</h3>
          <p>
            Verificação de desmatamento e uso do solo no MapBiomas Brasil
            (2020–2024).
          </p>
        </div>
      </div>

      <div className="form-grid three">
        <label>
          Região
          <input
            value={form.region}
            onChange={(e) => onUpdate("region", e.target.value)}
            placeholder={
              locationsStatus === "loading"
                ? "Carregando…"
                : "Preenchida automaticamente"
            }
          />
          <small>
            Preenchida automaticamente pelo município; você pode alterar se
            necessário.
          </small>
        </label>

        <div className="location-field">
          <label htmlFor="municipality">Município *</label>
          <input
            id="municipality"
            autoComplete="off"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={
              locationSuggestionsOpen && municipalitySuggestions.length > 0
            }
            value={form.municipality}
            onFocus={() => onSetLocationSuggestionsOpen(true)}
            onBlur={() =>
              window.setTimeout(() => onSetLocationSuggestionsOpen(false), 120)
            }
            onChange={(e) => {
              onUpdateMunicipality(e.target.value);
              onSetLocationSuggestionsOpen(true);
            }}
            placeholder="Digite e selecione o município"
          />
          {locationSuggestionsOpen && municipalitySuggestions.length > 0 && (
            <div className="municipality-suggestions" role="listbox">
              {municipalitySuggestions.map((municipality) => (
                <button
                  type="button"
                  role="option"
                  key={municipality.id}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => onSelectMunicipality(municipality)}
                >
                  <strong>{municipality.name}</strong>
                  <span>
                    {municipality.stateCode} · {municipality.stateName}
                  </span>
                </button>
              ))}
            </div>
          )}
          <small>
            {locationsStatus === "loading" ? (
              "Carregando lista oficial do IBGE…"
            ) : locationsStatus === "error" ? (
              <>
                Não foi possível carregar os municípios.{" "}
                <button
                  type="button"
                  className="location-retry"
                  onClick={onRetryLocations}
                >
                  Tentar novamente
                </button>
              </>
            ) : (
              "Digite ao menos duas letras e clique em uma opção."
            )}
          </small>
        </div>

        {exactMunicipalities.length > 1 && locationsStatus === "ready" ? (
          <label>
            Estado *
            <select
              value={
                exactMunicipalities.find((item) => item.stateName === form.state)
                  ?.stateCode ?? ""
              }
              onChange={(e) => onSelectMunicipalityState(e.target.value)}
            >
              <option value="">Selecione o estado</option>
              {exactMunicipalities.map((municipality) => (
                <option key={municipality.id} value={municipality.stateCode}>
                  {municipality.stateName} ({municipality.stateCode})
                </option>
              ))}
            </select>
            <small>Este nome de município existe em mais de um estado.</small>
          </label>
        ) : (
          <label>
            Estado *
            <input
              value={form.state}
              readOnly={locationsStatus !== "error"}
              onChange={(e) => onUpdate("state", e.target.value)}
              placeholder={
                locationsStatus === "loading"
                  ? "Carregando…"
                  : "Preenchido automaticamente"
              }
            />
          </label>
        )}

        <label>
          Data do mapeamento
          <input
            type="date"
            value={form.mappedAt}
            onChange={(e) => onUpdate("mappedAt", e.target.value)}
          />
        </label>

        <label>
          Data da verificação
          <input
            type="date"
            value={form.checkedAt}
            onChange={(e) => onUpdate("checkedAt", e.target.value)}
          />
        </label>

        <label>
          Resultado *
          <select
            value={form.compliance}
            onChange={(e) => onUpdate("compliance", e.target.value)}
          >
            <option value="">Selecione</option>
            <option>Em conformidade</option>
            <option>Não conforme</option>
            <option>Revisão necessária</option>
          </select>
        </label>
      </div>

      {/* MapBiomas Panel */}
      <div className="mapbiomas-panel">
        <div>
          <strong>
            MapBiomas Brasil · Série Temporal de Cobertura e Uso (2020–2024)
          </strong>
          <p>
            O polígono é analisado para verificar se houve supressão de
            vegetação nativa ou alteração de uso da terra após o marco temporal
            de 31/12/2020 (EUDR).
          </p>
          {!mapbiomasReady && (
            <small className="mapbiomas-prerequisite">
              Preencha código do talhão, fornecedor, município, estado e
              responsável pelo mapeamento.
            </small>
          )}
        </div>
        <button
          className="secondary-button"
          disabled={!mapbiomasReady || mapbiomasCheck.status === "loading"}
          onClick={onCheckMapbiomas}
        >
          {mapbiomasCheck.status === "loading"
            ? "Consultando…"
            : mapbiomasCheck.checkedAt
            ? "Consultar novamente"
            : "Consultar MapBiomas"}
        </button>
      </div>

      {/* MapBiomas Results */}
      {mapbiomasCheck.status !== "idle" &&
        mapbiomasCheck.status !== "loading" && (
          <div className={`mapbiomas-result ${mapbiomasCheck.status}`}>
            {mapbiomasCheck.status === "clear" && (
              <>
                <strong>
                  ✓ Sem perda de vegetação nativa detectada (2020–2024)
                </strong>
                <p>
                  A área mantém-se em conformidade com o marco temporal EUDR,
                  sem desmatamento ou supressão de floresta nativa.
                </p>
              </>
            )}
            {mapbiomasCheck.status === "attention" && (
              <>
                <strong>! Alteração de cobertura vegetal detectada</strong>
                <p>Revise a transição de classes de uso do solo no período:</p>
                <ul className="coverage-changes">
                  {mapbiomasCheck.changes.slice(0, 8).map((change, index) => (
                    <li
                      key={`${change.fromYear}-${change.toYear}-${change.className}-${index}`}
                    >
                      <b>
                        {change.fromYear}→{change.toYear}
                      </b>{" "}
                      · {change.className}:{" "}
                      {change.toHa.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      ha
                    </li>
                  ))}
                  {mapbiomasCheck.changes.length > 8 && (
                    <li>
                      Mais {mapbiomasCheck.changes.length - 8} registro(s).
                      Consulte a análise completa no link.
                    </li>
                  )}
                </ul>
              </>
            )}
            {mapbiomasCheck.status === "error" && (
              <>
                <strong>Não foi possível concluir a consulta</strong>
                <p>{mapbiomasCheck.message}</p>
              </>
            )}
            {mapbiomasCheck.verificationUrl && (
              <a
                className="verification-link"
                href={mapbiomasCheck.verificationUrl}
                target="_blank"
                rel="noreferrer"
              >
                Abrir talhão na Plataforma Interativa do MapBiomas ↗
              </a>
            )}
          </div>
        )}

      <label>
        Observações
        <textarea
          value={form.notes}
          onChange={(e) => onUpdate("notes", e.target.value)}
          placeholder="Registre evidências, ressalvas ou pendências."
        />
      </label>
    </article>
  );
}
