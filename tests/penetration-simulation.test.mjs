import assert from "node:assert/strict";
import test from "node:test";
import {
  createSessionToken,
  verifySessionToken,
  isAuthorizedForStorageKey,
  checkPasswordMatch,
  hashPassword,
} from "../app/lib/auth.ts";

test("PENTEST SIMULATION - OWASP A01: Broken Access Control (Horizontal IDOR/BOLA)", async () => {
  // Cenário: Cliente 'BELCO' autenticado tenta ler ou manipular arquivos de 'OUTRO_CLIENTE'
  const clientName = "BELCO";
  const victimClient = "CLIENTE_VITIMA";

  // 1. Leitura não autorizada de contrato de outro cliente
  const canReadVictimContract = isAuthorizedForStorageKey(
    "client",
    clientName,
    `contratos_clientes/${victimClient}/contrato_secreto.geojson`,
    "read"
  );
  assert.equal(canReadVictimContract, false, "ALERTA DE SEGURANÇA: Cliente não pode ler contratos de outro inquilino");

  // 2. Gravação/Exclusão não autorizada em pasta de outro cliente
  const canWriteVictimFolder = isAuthorizedForStorageKey(
    "client",
    clientName,
    `contratos_clientes/${victimClient}/malicioso.geojson`,
    "write"
  );
  assert.equal(canWriteVictimFolder, false, "ALERTA DE SEGURANÇA: Cliente não pode gravar na pasta de outro inquilino");

  // 3. Bypass por colisão de prefixo (ex: BELCO_EXPANDIDO vs BELCO)
  const canBypassByPrefix = isAuthorizedForStorageKey(
    "client",
    clientName,
    `contratos_clientes/${clientName}_HOLDING/dossie.zip`,
    "read"
  );
  assert.equal(canBypassByPrefix, false, "ALERTA DE SEGURANÇA: Bloqueio estrito de colisão parcial de prefixo de pasta");
});

test("PENTEST SIMULATION - OWASP A01: Broken Access Control (Path Traversal / Directory Escape)", () => {
  const client = "BELCO";

  // Tentativas de fuga de diretório (Directory Traversal)
  const traversalPayloads = [
    "contratos_clientes/BELCO/../../system_config.json",
    "contratos_clientes/BELCO/..\\..\\passwords.txt",
    "contratos_clientes/BELCO/../OUTRO_CLIENTE/dados.geojson",
    "contratos_clientes/BELCO/\0secret.json",
    "contratos_clientes/BELCO//root.json",
  ];

  for (const payload of traversalPayloads) {
    const isAllowed = isAuthorizedForStorageKey("client", client, payload, "read");
    assert.equal(isAllowed, false, `ALERTA DE SEGURANÇA: Path traversal payload deve ser rejeitado: ${payload}`);
  }
});

test("PENTEST SIMULATION - OWASP A01: Broken Function Level Authorization (Vertical Privilege Escalation)", async () => {
  // Cenário: Cliente comum tenta gravar na raiz ou em diretórios de sistema
  const clientName = "BELCO";

  const rootWrite = isAuthorizedForStorageKey("client", clientName, "config.json", "write");
  assert.equal(rootWrite, false, "Cliente não pode gravar na raiz do storage");

  const systemWrite = isAuthorizedForStorageKey("client", clientName, "system/audit_logs.csv", "write");
  assert.equal(systemWrite, false, "Cliente não pode gravar em pastas de auditoria do sistema");

  // Staff comum ('user') não pode sobrescrever arquivos soltos na raiz fora de pastas operacionais
  const staffRootWrite = isAuthorizedForStorageKey("user", undefined, "system_keys.json", "write");
  assert.equal(staffRootWrite, false, "Staff operacional não pode sobrescrever arquivos na raiz do storage");
});

test("PENTEST SIMULATION - OWASP A02: Cryptographic Failures & Token Forgery Bypass", async () => {
  // Cenário: Atacante tenta forjar token HMAC ou escalar de 'client' para 'admin'
  const honestToken = await createSessionToken({
    userKey: "cliente_comum",
    fullName: "Cliente Teste",
    role: "client",
    clientName: "FAZENDA_A",
  });

  const [b64Payload, sigHex] = honestToken.split(".");

  // 1. Modificação do payload para role 'admin' mantendo a assinatura original
  const decoded = JSON.parse(decodeURIComponent(escape(atob(b64Payload))));
  decoded.role = "admin";
  const forgedPayloadB64 = btoa(unescape(encodeURIComponent(JSON.stringify(decoded))));
  const forgedToken = `${forgedPayloadB64}.${sigHex}`;

  const verifiedForged = await verifySessionToken(forgedToken);
  assert.equal(verifiedForged, null, "ALERTA DE SEGURANÇA: Token forjado com role 'admin' deve ser sumariamente REJEITADO");

  // 2. Manipulação de bytes na assinatura (bit flipping)
  const corruptSig = sigHex.slice(0, -2) + (sigHex.slice(-2) === "aa" ? "bb" : "aa");
  const corruptToken = `${b64Payload}.${corruptSig}`;
  assert.equal(await verifySessionToken(corruptToken), null, "Assinatura adulterada deve ser REJEITADA");

  // 3. Token com expiração no passado (Replay de token antigo)
  const expiredToken = await createSessionToken(
    {
      userKey: "admin",
      fullName: "Admin",
      role: "admin",
    },
    -60 // expirado há 60 segundos
  );
  assert.equal(await verifySessionToken(expiredToken), null, "Token expirado deve ser REJEITADO");
});

test("PENTEST SIMULATION - OWASP A07: Authentication & Credential Stuffing Defenses", async () => {
  // Senha real de teste
  const realPassword = "FafUltraSecret#2026";
  const validHash = await hashPassword(realPassword);

  // 1. Tentativa de bypass enviando a senha em texto puro contra o validador
  assert.equal(await checkPasswordMatch(realPassword, realPassword), false, "Texto puro jamais pode autenticar");

  // 2. Tentativa com senhas comuns / default
  const commonPasswords = ["admin", "123456", "password", "faf123", "root", ""];
  for (const guess of commonPasswords) {
    assert.equal(await checkPasswordMatch(guess, validHash), false, `Tentativa com "${guess}" deve falhar`);
  }

  // 3. Autenticação correta apenas com a senha exata
  assert.equal(await checkPasswordMatch(realPassword, validHash), true, "Senha correta deve ser aprovada");
});
