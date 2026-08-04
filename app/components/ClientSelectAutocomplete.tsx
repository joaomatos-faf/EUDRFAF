"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  EuropeanClientRecord,
  getSavedClientsList,
  saveNewCustomClient,
} from "@/app/lib/clientsStore";

interface ClientSelectAutocompleteProps {
  value: string;
  onChange: (clientName: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
}

const COUNTRY_FLAGS: Record<string, string> = {
  frança: "🇫🇷",
  germany: "🇩🇪",
  alemanha: "🇩🇪",
  suécia: "🇸🇪",
  sweden: "🇸🇪",
  itália: "🇮🇹",
  italy: "🇮🇹",
  "reino unido": "🇬🇧",
  uk: "🇬🇧",
  irlanda: "🇮🇪",
  ireland: "🇮🇪",
  portugal: "🇵🇹",
  áustria: "🇦🇹",
  austria: "🇦🇹",
  tchéquia: "🇨🇿",
  czechia: "🇨🇿",
  suíça: "🇨🇭",
  switzerland: "🇨🇭",
  sérvia: "🇷🇸",
  chipre: "🇨🇾",
  rússia: "🇷🇺",
  holanda: "🇳🇱",
  netherlands: "🇳🇱",
  bélgica: "🇧🇪",
  belgium: "🇧🇪",
  espanha: "🇪🇸",
  spain: "🇪🇸",
  dinamarca: "🇩🇰",
  noruega: "🇳🇴",
  finlândia: "🇫🇮",
  polônia: "🇵🇱",
  europa: "🇪🇺",
};

function getCountryFlag(country = ""): string {
  const norm = country.toLowerCase().trim();
  return COUNTRY_FLAGS[norm] || "🇪🇺";
}

export function ClientSelectAutocomplete({
  value,
  onChange,
  label = "Cliente / Importador Europeu *",
  placeholder = "Selecione ou pesquise uma empresa...",
  required = false,
}: ClientSelectAutocompleteProps) {
  const [clients, setClients] = useState<EuropeanClientRecord[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newCompanyCountry, setNewCompanyCountry] = useState("Alemanha");
  const [errorMsg, setErrorMsg] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const reloadClients = () => {
    setClients(getSavedClientsList());
  };

  useEffect(() => {
    reloadClients();
  }, []);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Foco automático no campo de busca ao abrir o dropdown
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  const filteredClients = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return clients;
    return clients.filter((c) => {
      return (
        c.name.toLowerCase().includes(q) ||
        (c.country && c.country.toLowerCase().includes(q))
      );
    });
  }, [clients, searchTerm]);

  const selectedClientObj = useMemo(() => {
    return clients.find(
      (c) => c.name.toLowerCase().trim() === (value || "").toLowerCase().trim()
    );
  }, [clients, value]);

  const handleSelectClient = (client: EuropeanClientRecord) => {
    onChange(client.name);
    setSearchTerm("");
    setIsOpen(false);
  };

  const handleClearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setSearchTerm("");
  };

  const handleCreateNewCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyName.trim()) {
      setErrorMsg("Informe o nome da empresa.");
      return;
    }

    try {
      const created = saveNewCustomClient(newCompanyName, newCompanyCountry);
      reloadClients();
      onChange(created.name);
      setNewCompanyName("");
      setNewCompanyCountry("Alemanha");
      setShowAddModal(false);
      setIsOpen(false);
      setErrorMsg("");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Erro ao adicionar empresa.";
      setErrorMsg(msg);
    }
  };

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%" }}>
      {label && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "6px",
          }}
        >
          <label
            style={{
              fontSize: "12px",
              fontWeight: 700,
              color: "var(--forest-950, #0f261e)",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span style={{ fontSize: "14px" }}>🏢</span>
            <span>{label}</span>
          </label>
          <button
            type="button"
            onClick={() => {
              setNewCompanyName(searchTerm);
              setShowAddModal(true);
            }}
            style={{
              background: "transparent",
              border: "none",
              color: "#059669",
              fontSize: "11.5px",
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "2px 6px",
              borderRadius: "4px",
              transition: "color 0.15s ease",
            }}
          >
            <span>➕</span> Nova Empresa
          </button>
        </div>
      )}

      {/* Input de Seleção / Dropdown Trigger */}
      <div style={{ position: "relative" }}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          style={{
            width: "100%",
            padding: "11px 14px",
            borderRadius: "10px",
            border: value
              ? "1.5px solid #10b981"
              : isOpen
              ? "1.5px solid #059669"
              : "1px solid var(--line-strong, #cbd5e1)",
            background: value ? "#f0fdf4" : "#ffffff",
            fontSize: "13.5px",
            textAlign: "left",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            cursor: "pointer",
            boxShadow: isOpen
              ? "0 0 0 3px rgba(16, 185, 129, 0.15)"
              : "0 1px 2px rgba(0, 0, 0, 0.04)",
            transition: "all 0.15s ease",
            outline: "none",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              flex: 1,
            }}
          >
            {value ? (
              <>
                <span style={{ fontSize: "15px" }}>
                  {getCountryFlag(selectedClientObj?.country)}
                </span>
                <span
                  style={{
                    fontWeight: 700,
                    color: "var(--forest-950, #0f261e)",
                    fontSize: "13.5px",
                  }}
                >
                  {value}
                </span>
                {selectedClientObj?.country && (
                  <span
                    style={{
                      fontSize: "11px",
                      background: "rgba(16, 185, 129, 0.14)",
                      color: "#065f46",
                      padding: "2px 8px",
                      borderRadius: "6px",
                      fontWeight: 700,
                      letterSpacing: "0.2px",
                    }}
                  >
                    {selectedClientObj.country}
                  </span>
                )}
              </>
            ) : (
              <span style={{ color: "var(--muted, #64748b)", fontWeight: 500 }}>
                {placeholder}
              </span>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            {value && (
              <span
                onClick={handleClearSelection}
                title="Limpar seleção"
                style={{
                  fontSize: "12px",
                  color: "#94a3b8",
                  padding: "2px 6px",
                  borderRadius: "4px",
                  cursor: "pointer",
                  transition: "color 0.15s ease",
                }}
              >
                ✕
              </span>
            )}
            <span
              style={{
                fontSize: "11px",
                color: value ? "#059669" : "var(--muted, #94a3b8)",
                transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.15s ease",
              }}
            >
              ▼
            </span>
          </div>
        </button>

        {required && (
          <input
            type="text"
            value={value}
            required={required}
            onChange={() => {}}
            style={{
              position: "absolute",
              opacity: 0,
              pointerEvents: "none",
              bottom: 0,
              left: 0,
              width: "100%",
              height: 0,
            }}
          />
        )}
      </div>

      {/* Floating Dropdown Menu */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            zIndex: 999,
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "14px",
            boxShadow:
              "0 12px 36px -4px rgba(15, 38, 30, 0.15), 0 4px 12px -2px rgba(15, 38, 30, 0.08)",
            overflow: "hidden",
            maxHeight: "360px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Search Box */}
          <div
            style={{
              padding: "10px 12px",
              borderBottom: "1px solid #f1f5f9",
              background: "#f8fafc",
            }}
          >
            <div style={{ position: "relative" }}>
              <span
                style={{
                  position: "absolute",
                  left: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: "13px",
                  color: "#94a3b8",
                }}
              >
                🔍
              </span>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Buscar cliente europeu ou país..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 10px 8px 32px",
                  fontSize: "13px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  outline: "none",
                  background: "#ffffff",
                  fontWeight: 500,
                }}
              />
            </div>
          </div>

          {/* List of Clients */}
          <div
            style={{
              overflowY: "auto",
              flex: 1,
              padding: "6px 0",
              maxHeight: "240px",
            }}
          >
            {filteredClients.length === 0 ? (
              <div
                style={{
                  padding: "24px 16px",
                  textAlign: "center",
                  color: "#64748b",
                  fontSize: "13px",
                }}
              >
                <p style={{ margin: "0 0 10px", fontWeight: 500 }}>
                  Nenhuma empresa encontrada para &quot;{searchTerm}&quot;.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setNewCompanyName(searchTerm);
                    setShowAddModal(true);
                    setIsOpen(false);
                  }}
                  style={{
                    background:
                      "linear-gradient(135deg, #092e20 0%, #134e38 100%)",
                    color: "#ffffff",
                    border: "none",
                    padding: "8px 14px",
                    borderRadius: "8px",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: "0 2px 6px rgba(9, 46, 32, 0.2)",
                  }}
                >
                  ➕ Cadastrar &quot;{searchTerm}&quot;
                </button>
              </div>
            ) : (
              filteredClients.map((client) => {
                const isSelected =
                  (value || "").toLowerCase().trim() ===
                  client.name.toLowerCase().trim();
                const flag = getCountryFlag(client.country);

                return (
                  <button
                    key={client.name}
                    type="button"
                    onClick={() => handleSelectClient(client)}
                    style={{
                      width: "100%",
                      padding: "9px 14px",
                      border: "none",
                      background: isSelected ? "#ecfdf5" : "transparent",
                      color: isSelected ? "#065f46" : "#1e293b",
                      fontSize: "13px",
                      fontWeight: isSelected ? 800 : 500,
                      textAlign: "left",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      cursor: "pointer",
                      transition: "background 0.12s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected)
                        (e.currentTarget as HTMLButtonElement).style.background =
                          "#f8fafc";
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected)
                        (e.currentTarget as HTMLButtonElement).style.background =
                          "transparent";
                    }}
                  >
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <span style={{ fontSize: "14px" }}>{flag}</span>
                      <span>{client.name}</span>
                    </span>
                    <span
                      style={{
                        fontSize: "11px",
                        color: isSelected ? "#065f46" : "#64748b",
                        background: isSelected
                          ? "rgba(16, 185, 129, 0.18)"
                          : "#f1f5f9",
                        padding: "2px 8px",
                        borderRadius: "6px",
                        fontWeight: 600,
                      }}
                    >
                      {client.country || "Europa"}
                    </span>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer Bar */}
          <div
            style={{
              padding: "10px 14px",
              borderTop: "1px solid #f1f5f9",
              background: "#f8fafc",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontSize: "11.5px",
                color: "#64748b",
                fontWeight: 600,
              }}
            >
              🇪🇺 {clients.length} empresas europeias cadastradas
            </span>
            <button
              type="button"
              onClick={() => {
                setShowAddModal(true);
                setIsOpen(false);
              }}
              style={{
                background: "transparent",
                border: "none",
                color: "#059669",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
                padding: "4px 6px",
                display: "inline-flex",
                alignItems: "center",
                gap: "3px",
              }}
            >
              <span>➕</span> Cadastrar Nova
            </button>
          </div>
        </div>
      )}

      {/* Modal / Backdrop para Cadastrar Nova Empresa */}
      {showAddModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(10, 30, 24, 0.65)",
            backdropFilter: "blur(6px)",
            display: "grid",
            placeItems: "center",
            padding: "16px",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "440px",
              background: "#ffffff",
              borderRadius: "16px",
              padding: "26px",
              boxShadow: "0 24px 48px rgba(0, 0, 0, 0.28)",
              border: "1px solid rgba(255, 255, 255, 0.8)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "18px",
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 800,
                    color: "var(--orange-500, #d77442)",
                    letterSpacing: ".08em",
                    textTransform: "uppercase",
                  }}
                >
                  FAF EUDR • BASE DE CLIENTES
                </span>
                <h3
                  style={{
                    margin: "2px 0 0",
                    fontSize: "17px",
                    color: "var(--forest-950, #0f261e)",
                    fontWeight: 800,
                  }}
                >
                  🏢 Cadastrar Empresa Europeia
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setErrorMsg("");
                }}
                style={{
                  background: "#f1f5f9",
                  border: "none",
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  fontSize: "14px",
                  cursor: "pointer",
                  color: "#64748b",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleCreateNewCompany}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "14px",
              }}
            >
              <label
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "var(--forest-950, #0f261e)",
                }}
              >
                Nome da Empresa / Torrefação *
                <input
                  type="text"
                  placeholder="Ex: Nordic Roastery AB"
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  autoFocus
                  required
                  style={{
                    width: "100%",
                    marginTop: "5px",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "13.5px",
                    outline: "none",
                  }}
                />
              </label>

              <label
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "var(--forest-950, #0f261e)",
                }}
              >
                País Europeu de Destino
                <input
                  type="text"
                  placeholder="Ex: Alemanha, França, Suécia, Holanda..."
                  value={newCompanyCountry}
                  onChange={(e) => setNewCompanyCountry(e.target.value)}
                  style={{
                    width: "100%",
                    marginTop: "5px",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "13.5px",
                    outline: "none",
                  }}
                />
              </label>

              {errorMsg && (
                <div
                  style={{
                    padding: "8px 12px",
                    background: "#fef2f2",
                    borderRadius: "8px",
                    border: "1px solid #fecaca",
                    color: "#b91c1c",
                    fontSize: "12px",
                    fontWeight: 600,
                  }}
                >
                  {errorMsg}
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  marginTop: "6px",
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setErrorMsg("");
                  }}
                  style={{
                    flex: 1,
                    padding: "11px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    background: "#f8fafc",
                    color: "#475569",
                    fontSize: "13px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1.2,
                    padding: "11px",
                    borderRadius: "8px",
                    border: "none",
                    background:
                      "linear-gradient(135deg, #092e20 0%, #134e38 100%)",
                    color: "#ffffff",
                    fontSize: "13px",
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(9, 46, 32, 0.25)",
                  }}
                >
                  Salvar e Selecionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
