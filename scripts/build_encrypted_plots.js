const xlsx = require("xlsx");
const fs = require("fs");
const crypto = require("crypto");
const path = require("path");

function buildEncryptedFile() {
  const excelPath = path.join(process.cwd(), "Lista IDPLOT geojson.xlsx");
  const wb = xlsx.readFile(excelPath);
  const sheetName = wb.SheetNames[0];
  const rawRows = xlsx.utils.sheet_to_json(wb.Sheets[sheetName]);

  const cleanRows = rawRows
    .map((row) => ({
      plotId: String(row["PLOT ID"] || "").trim().toUpperCase(),
      farm: String(row["Nome da Fazenda "] || row["Nome da Fazenda"] || "").trim(),
      producer: String(row["Nome do Produtor "] || row["Nome do Produtor"] || "").trim(),
      supplier: String(row["Fornecedor"] || "").trim(),
      region: String(row["Região"] || "GERAL").trim(),
      hectares: parseFloat(String(row["Hectares"] || "0").replace(",", ".")) || 0,
    }))
    .filter((r) => r.plotId.length > 0);

  const SECRET_KEY = crypto.createHash("sha256").update("FAF_EUDR_SECRET_KEY_2026_FAF").digest();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", SECRET_KEY, iv);
  let encrypted = cipher.update(JSON.stringify(cleanRows), "utf8", "hex");
  encrypted += cipher.final("hex");

  const fileContent = `import crypto from "node:crypto";

export interface PlotMasterRecord {
  plotId: string;
  farm: string;
  producer: string;
  supplier: string;
  region: string;
  hectares: number;
}

// Payload Criptografado em AES-256-CBC (Protecao total dos dados dos produtores/fazendas)
const ENCRYPTED_PAYLOAD = {
  iv: "${iv.toString("hex")}",
  data: "${encrypted}",
};

const SECRET_KEY = crypto.createHash("sha256").update("FAF_EUDR_SECRET_KEY_2026_FAF").digest();

let decryptedCache: PlotMasterRecord[] | null = null;

export function getDecryptedPlotMasterList(): PlotMasterRecord[] {
  if (decryptedCache) return decryptedCache;
  try {
    const decipher = crypto.createDecipheriv("aes-256-cbc", SECRET_KEY, Buffer.from(ENCRYPTED_PAYLOAD.iv, "hex"));
    let decrypted = decipher.update(ENCRYPTED_PAYLOAD.data, "hex", "utf8");
    decrypted += decipher.final("utf8");
    decryptedCache = JSON.parse(decrypted);
    return decryptedCache!;
  } catch (err) {
    console.error("Erro ao decriptografar dados de IDPLOT:", err);
    return [];
  }
}
`;

  fs.writeFileSync(path.join(process.cwd(), "app/lib/plotMasterData.ts"), fileContent, "utf8");
  console.log(`✅ Criptografia AES-256-CBC concluída com sucesso! ${cleanRows.length} talhões protegidos.`);
}

buildEncryptedFile();
