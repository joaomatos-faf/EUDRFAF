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
    .map((row) => {
      const rawPlot = String(
        row["PLOTID"] || row["PLOT ID"] || row["plotId"] || row["PlotID"] || ""
      ).trim();
      const farm = String(
        row["Nome da Fazenda "] || row["Nome da Fazenda"] || row["Fazenda"] || row["farm"] || ""
      ).trim();
      const producer = String(
        row["Nome do Produtor "] || row["Nome do Produtor"] || row["Produtor"] || row["producer"] || ""
      ).trim();
      const supplier = String(
        row["Fornecedor "] || row["Fornecedor"] || row["supplier"] || producer
      ).trim();
      const region = String(row["Região "] || row["Região"] || row["region"] || "GERAL").trim();
      const hectares =
        parseFloat(String(row["Hectares "] || row["Hectares"] || row["hectares"] || "0").replace(",", ".")) || 0;

      return {
        plotId: rawPlot.toUpperCase(),
        farm,
        producer,
        supplier,
        region,
        hectares,
      };
    })
    .filter((r) => r.plotId.length > 0);

  const SECRET_KEY = crypto.createHash("sha256").update("FAF_EUDR_SECRET_KEY_2026_FAF").digest();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", SECRET_KEY, iv);
  let encrypted = cipher.update(JSON.stringify(cleanRows), "utf8", "hex");
  encrypted += cipher.final("hex");

  const fileContent = `export interface PlotMasterRecord {
  plotId: string;
  farm: string;
  producer: string;
  supplier: string;
  region: string;
  hectares: number;
}

// Payload Criptografado em AES-256-CBC (Protecao total dos dados dos produtores/fazendas)
export const ENCRYPTED_PAYLOAD = {
  iv: "${iv.toString("hex")}",
  data: "${encrypted}",
};

let decryptedCache: PlotMasterRecord[] | null = null;

export function getDecryptedPlotMasterList(): PlotMasterRecord[] {
  if (decryptedCache) return decryptedCache;
  if (typeof window !== "undefined") return [];

  try {
    const crypto = require("node:crypto");
    const secretKey = crypto.createHash("sha256").update("FAF_EUDR_SECRET_KEY_2026_FAF").digest();
    const decipher = crypto.createDecipheriv("aes-256-cbc", secretKey, Buffer.from(ENCRYPTED_PAYLOAD.iv, "hex"));
    let decrypted = decipher.update(ENCRYPTED_PAYLOAD.data, "hex", "utf8");
    decrypted += decipher.final("utf8");
    decryptedCache = JSON.parse(decrypted);
    return decryptedCache!;
  } catch (err) {
    console.error("Erro ao decriptografar dados de IDPLOT no servidor:", err);
    return [];
  }
}
`;

  fs.writeFileSync(path.join(process.cwd(), "app/lib/plotMasterData.ts"), fileContent, "utf8");
  console.log(`✅ Criptografia AES-256-CBC atualizada! ${cleanRows.length} talhões protegidos.`);
}

buildEncryptedFile();
