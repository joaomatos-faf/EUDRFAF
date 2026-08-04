"use client";

import React, { useState, useEffect, useRef } from "react";
import { EuropeanClientRecord, getSavedClientsList, saveNewCustomClient } from "@/app/lib/clientsStore";

interface ClientSelectAutocompleteProps {
  value: string;
  onChange: (clientName: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
}

export function ClientSelectAutocomplete({
  value,
  onChange,
  label = "Empresa do Cliente / Importador *",
  placeholder = "Selecione ou busque uma empresa...",
  required = false,
}: ClientSelectAutocompleteProps) {
  const [clients, setClients] = useState<EuropeanClientRecord[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newCompanyCountry, setNewCompanyCountry] = useState("Europa");
  const [errorMsg, setErrorMsg] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);

  const reloadClients = () => {
    setClients(getSavedClientsList());
  };

  useEffect(() => {
    reloadClients();
  }, []);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredClients = clients.filter((c) => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      (c.country && c.country.toLowerCase().includes(q))
    );
  });

  const handleSelectClient = (client: EuropeanClientRecord) => {
    onChange(client.name);
    setSearchTerm("");
    setIsOpen(false);
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
      setNewCompanyCountry("Europa");
      setShowAddModal(false);
      setIsOpen(false);
      setErrorMsg("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao adicionar empresa.";
      setErrorMsg(msg);
    }
  };

  const selectedClientObj = clients.find(
    (c) => c.name.toLowerCase().trim() === (value || "").toLowerCase().trim()
  );

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%" }}>
      {label && (
        <label
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "11px",
            fontWeight: 700,
            color: "var(--forest-950, #102c24)",
            marginBottom: "4px",
          }}
        >
          <span>🏢 {label}</span>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            style={{
              background: "transparent",
              border: "none",
              color: "#0284c7",
              fontSize: "11px",
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "3px",
              padding: 0,
            }}
          >
            <span>➕</span> Adicionar Nova Empresa
          </button>
        </label>
      )}

      {/* Input de Seleção / Dropdown Trigger */}
      <div style={{ position: "relative" }}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          style={{
            width: "100%",
            padding: "8px 12px",
            borderRadius: "6px",
            border: value ? "1px solid #0284c7" : "1px solid var(--line, #c8d3cc)",
            background: value ? "#f0f9ff" : "var(--surface, #ffffff)",
            fontSize: "13px",
            color: value ? "#0369a1" : "var(--muted, #66736d)",
            textAlign: "left",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            cursor: "pointer",
            fontWeight: value ? 700 : 500,
            outline: "none",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: "8px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {value ? (
              <>
                <span style={{ color: "#0284c7" }}>🏢</span>
                <span style={{ color: "var(--forest-950, #102c24)" }}>{value}</span>
                {selectedClientObj?.country && (
                  <span
                    style={{
                      fontSize: "10.5px",
                      background: "rgba(2, 132, 199, 0.12)",
                      color: "#0284c7",
                      padding: "2px 8px",
                      borderRadius: "6px",
                      fontWeight: 700,
                    }}
                  >
                    {selectedClientObj.country}
                  </span>
                )}
              </>
            ) : (
              <span>{placeholder}</span>
            )}
          </span>
          <span style={{ fontSize: "11px", color: "var(--muted, #8a958f)", marginLeft: "8px" }}>▼</span>
        </button>

        {/* Hidden input for form requirement if needed */}
        {required && (
          <input
            type="text"
            value={value}
            required={required}
            onChange={() => {}}
            style={{ position: "absolute", opacity: 0, pointerEvents: "none", bottom: 0, left: 0, width: "100%", height: 0 }}
          />
        )}
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            zIndex: 150,
            background: "#ffffff",
            border: "1px solid var(--line-strong, #c8d3cc)",
            borderRadius: "10px",
            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)",
            overflow: "hidden",
            maxHeight: "320px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Search Box in Dropdown */}
          <div style={{ padding: "8px", borderBottom: "1px solid var(--line, #e2e8f0)", background: "#f8fafc" }}>
            <input
              type="text"
              placeholder="🔍 Buscar cliente europeu ou país..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
              style={{
                width: "100%",
                padding: "6px 10px",
                fontSize: "12px",
                borderRadius: "6px",
                border: "1px solid var(--line, #cbd5e1)",
                outline: "none",
                background: "#ffffff",
              }}
            />
          </div>

          {/* List of Clients */}
          <div style={{ overflowY: "auto", flex: 1, padding: "4px 0" }}>
            {filteredClients.length === 0 ? (
              <div style={{ padding: "16px 12px", textAlign: "center", color: "var(--muted, #64748b)", fontSize: "12px" }}>
                <p style={{ margin: "0 0 8px" }}>Nenhuma empresa encontrada para &quot;{searchTerm}&quot;.</p>
                <button
                  type="button"
                  onClick={() => {
                    setNewCompanyName(searchTerm);
                    setShowAddModal(true);
                    setIsOpen(false);
                  }}
                  style={{
                    background: "#0284c7",
                    color: "#ffffff",
                    border: "none",
                    padding: "6px 12px",
                    borderRadius: "6px",
                    fontSize: "11px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  ➕ Cadastrar &quot;{searchTerm}&quot;
                </button>
              </div>
            ) : (
              filteredClients.map((client) => {
                const isSelected = (value || "").toLowerCase().trim() === client.name.toLowerCase().trim();
                return (
                  <button
                    key={client.name}
                    type="button"
                    onClick={() => handleSelectClient(client)}
                    style={{
                      width: "100%",
                      padding: "8px 14px",
                      border: "none",
                      background: isSelected ? "#e0f2fe" : "transparent",
                      color: isSelected ? "#0369a1" : "var(--forest-950, #1e293b)",
                      fontSize: "12.5px",
                      fontWeight: isSelected ? 700 : 500,
                      textAlign: "left",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      cursor: "pointer",
                      transition: "background 0.1s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = "#f1f5f9";
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                    }}
                  >
                    <span>{client.name}</span>
                    <span
                      style={{
                        fontSize: "10.5px",
                        color: isSelected ? "#0284c7" : "#64748b",
                        background: isSelected ? "rgba(2, 132, 199, 0.15)" : "#f1f5f9",
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

          {/* Bottom Button to Add More Companies */}
          <div
            style={{
              padding: "8px 12px",
              borderTop: "1px solid var(--line, #e2e8f0)",
              background: "#f8fafc",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: "11px", color: "var(--muted, #64748b)", fontWeight: 600 }}>
              {clients.length} empresas europeias
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
                color: "#0284c7",
                fontSize: "11.5px",
                fontWeight: 700,
                cursor: "pointer",
                padding: "4px 8px",
              }}
            >
              ➕ Nova Empresa
            </button>
          </div>
        </div>
      )}

      {/* Modal / Popover para Cadastrar Nova Empresa */}
      {showAddModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 300,
            background: "rgba(16, 44, 36, 0.65)",
            backdropFilter: "blur(4px)",
            display: "grid",
            placeItems: "center",
            padding: "16px",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "420px",
              background: "#ffffff",
              borderRadius: "14px",
              padding: "24px",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.25)",
              border: "1px solid var(--line, #cbd5e1)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "16px", color: "var(--forest-950, #0f172a)", fontWeight: 700 }}>
                🏢 Cadastrar Nova Empresa
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setErrorMsg("");
                }}
                style={{ background: "transparent", border: "none", fontSize: "16px", cursor: "pointer", color: "#64748b" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNewCompany} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <label style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--forest-950, #1e293b)" }}>
                Nome da Empresa / Cliente *
                <input
                  type="text"
                  placeholder="Ex: Nordic Roastery AB"
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  autoFocus
                  required
                  style={{
                    width: "100%",
                    marginTop: "4px",
                    padding: "8px 10px",
                    borderRadius: "6px",
                    border: "1px solid var(--line, #cbd5e1)",
                    fontSize: "13px",
                  }}
                />
              </label>

              <label style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--forest-950, #1e293b)" }}>
                País / Região
                <input
                  type="text"
                  placeholder="Ex: Alemanha, França, Holanda..."
                  value={newCompanyCountry}
                  onChange={(e) => setNewCompanyCountry(e.target.value)}
                  style={{
                    width: "100%",
                    marginTop: "4px",
                    padding: "8px 10px",
                    borderRadius: "6px",
                    border: "1px solid var(--line, #cbd5e1)",
                    fontSize: "13px",
                  }}
                />
              </label>

              {errorMsg && (
                <p style={{ margin: 0, color: "#dc2626", fontSize: "12px", fontWeight: 600 }}>{errorMsg}</p>
              )}

              <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setErrorMsg("");
                  }}
                  style={{
                    flex: 1,
                    padding: "9px",
                    borderRadius: "6px",
                    border: "1px solid var(--line, #cbd5e1)",
                    background: "#f1f5f9",
                    color: "#475569",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: "9px",
                    borderRadius: "6px",
                    border: "none",
                    background: "linear-gradient(135deg, #092e20 0%, #134e38 100%)",
                    color: "#ffffff",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
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
