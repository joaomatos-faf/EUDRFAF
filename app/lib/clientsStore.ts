"use client";

export interface EuropeanClientRecord {
  name: string;
  country: string;
}

// Lista base de clientes europeus extraída da planilha "Lista clientes.xlsx"
export const INITIAL_EUROPEAN_CLIENTS: EuropeanClientRecord[] = [
  { name: "Alchimiste Café", country: "França" },
  { name: "Anne Caron", country: "França" },
  { name: "Belco Sas", country: "França" },
  { name: "Blue Butterfly Coffee Co.", country: "Irlanda" },
  { name: "Cafés Folliet", country: "França" },
  { name: "Carrow Coffee Roasters", country: "Irlanda" },
  { name: "Coleur Café", country: "França" },
  { name: "Coutume", country: "França" },
  { name: "Doubleshot", country: "Tchéquia" },
  { name: "Fabrica Coffee Roasters", country: "Portugal" },
  { name: "Five Elephant Coffee Roastery", country: "Alemanha" },
  { name: "Gringo Nordic Coffee Roasters", country: "Suécia" },
  { name: "Johan & Nyström", country: "Suécia" },
  { name: "Julius Meinl Austria Gmbh", country: "Áustria" },
  { name: "Julius Meinl Italy", country: "Itália" },
  { name: "Kontext Coffee Company", country: "Reino Unido" },
  { name: "Koppi", country: "Suécia" },
  { name: "Le Piantagioni Del Caffe Srl", country: "Itália" },
  { name: "Les Cafés Du Phare", country: "França" },
  { name: "Lykke Kaffegardar", country: "Suécia" },
  { name: "Mlin Produkt Doo", country: "Sérvia" },
  { name: "Momus", country: "França" },
  { name: "Morgon Coffee Roasters", country: "Suécia" },
  { name: "Mr. Hoban", country: "Alemanha" },
  { name: "Notes Coffee Roasters", country: "Reino Unido" },
  { name: "Omk Wagmi Coffee Ltd", country: "Chipre" },
  { name: "Ordinary Coffee Roasters", country: "Alemanha" },
  { name: "Quo", country: "Suécia" },
  { name: "Stockholm Roast", country: "Suécia" },
  { name: "Sucafina Sa", country: "Suíça" },
  { name: "Terres De Café", country: "França" },
  { name: "The Barn Gmbh", country: "Alemanha" },
  { name: "Ultramar Caffe’ S.R.L.", country: "Itália" },
  { name: "Union Hand Roasted Coffee", country: "Reino Unido" },
  { name: "United Investment - Russia", country: "Rússia" },
  { name: "Vaya Coffee", country: "França" },
];

const LOCAL_STORAGE_CUSTOM_CLIENTS_KEY = "faf_eudr_custom_clients_v1";

/**
 * Obtém a lista completa de clientes (Base Europeia + Adicionados pelo Usuário)
 */
export function getSavedClientsList(): EuropeanClientRecord[] {
  if (typeof window === "undefined") {
    return INITIAL_EUROPEAN_CLIENTS;
  }

  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_CUSTOM_CLIENTS_KEY);
    if (!raw) return INITIAL_EUROPEAN_CLIENTS;
    const customList: EuropeanClientRecord[] = JSON.parse(raw);

    // Mesclar garantindo que não haja duplicatas por nome
    const namesSet = new Set(INITIAL_EUROPEAN_CLIENTS.map((c) => c.name.toLowerCase().trim()));
    const validCustom = customList.filter(
      (c) => c && c.name && !namesSet.has(c.name.toLowerCase().trim())
    );

    return [...INITIAL_EUROPEAN_CLIENTS, ...validCustom].sort((a, b) =>
      a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" })
    );
  } catch {
    return INITIAL_EUROPEAN_CLIENTS;
  }
}

/**
 * Salva uma nova empresa/cliente na lista persistente local
 */
export function saveNewCustomClient(name: string, country = "Europa"): EuropeanClientRecord {
  const cleanName = name.trim();
  const cleanCountry = country.trim() || "Europa";

  if (!cleanName) {
    throw new Error("Nome da empresa não pode ser vazio.");
  }

  const currentList = getSavedClientsList();
  const existing = currentList.find(
    (c) => c.name.toLowerCase().trim() === cleanName.toLowerCase()
  );

  if (existing) {
    return existing;
  }

  const newRecord: EuropeanClientRecord = { name: cleanName, country: cleanCountry };

  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_CUSTOM_CLIENTS_KEY);
      const customList: EuropeanClientRecord[] = raw ? JSON.parse(raw) : [];
      customList.push(newRecord);
      localStorage.setItem(LOCAL_STORAGE_CUSTOM_CLIENTS_KEY, JSON.stringify(customList));
    } catch (err) {
      console.error("Erro ao persistir cliente customizado:", err);
    }
  }

  return newRecord;
}
