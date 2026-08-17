/**
 * Secure PBKDF2 Password Hashing & Verification (WebCrypto API)
 * & HMAC-SHA256 Multi-Tenant Session Management
 * 100% Native to Edge Runtimes (Cloudflare Workers / Browser / Node.js)
 */

const DEFAULT_ITERATIONS = 100_000;
const HASH_ALGO = "SHA-512";
const KEY_LEN_BITS = 256;

function bufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBuffer(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Retrieves session secret from Cloudflare Workers env or Node process.env.
 * Throws in production if the secret is missing to prevent insecure defaults.
 */
export async function getSessionSecret(): Promise<string> {
  try {
    const cf = await import("cloudflare:workers");
    if (cf?.env?.SESSION_SECRET && typeof cf.env.SESSION_SECRET === "string" && cf.env.SESSION_SECRET.trim().length > 0) {
      return cf.env.SESSION_SECRET;
    }
  } catch {}

  if (typeof process !== "undefined" && process.env?.SESSION_SECRET && process.env.SESSION_SECRET.trim().length > 0) {
    return process.env.SESSION_SECRET;
  }

  // Allow fallback ONLY during local testing / development
  if (
    typeof process !== "undefined" &&
    (process.env?.NODE_ENV === "test" || process.env?.NODE_ENV === "development" || !process.env?.NODE_ENV)
  ) {
    return "FAF_EUDR_DEV_ONLY_TEST_SESSION_SECRET_2026";
  }

  throw new Error("ERRO CRÍTICO DE SEGURANÇA: A variável de ambiente SESSION_SECRET não está configurada em produção.");
}

/**
 * Generates a cryptographically secure PBKDF2-HMAC-SHA512 hash with unique 16-byte salt
 * Output format: pbkdf2:<iterations>:<salt_hex>:<hash_hex>
 */
export async function hashPassword(password: string, iterations = DEFAULT_ITERATIONS): Promise<string> {
  const encoder = new TextEncoder();
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);

  const baseKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt as unknown as ArrayBuffer,
      iterations,
      hash: HASH_ALGO,
    },
    baseKey,
    KEY_LEN_BITS
  );

  const saltHex = bufferToHex(salt.buffer as ArrayBuffer);
  const hashHex = bufferToHex(derivedBits);

  return `pbkdf2:${iterations}:${saltHex}:${hashHex}`;
}

/**
 * Legacy SHA-256 + Salt hashing for backward compatibility
 */
export async function hashPasswordLegacy(password: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode("FAF_EUDR_SALT_2026_" + password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
  return bufferToHex(hashBuffer);
}

/**
 * Constant-time comparison between two strings to prevent timing attacks
 */
export function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Verifies password match against:
 * 1. Modern PBKDF2 (pbkdf2:<iterations>:salt:hash)
 * 2. Legacy SHA-256 (64 hex characters)
 * STRICT: NEVER accepts plaintext fallback
 */
export async function checkPasswordMatch(inputPass: string, storedValue: string): Promise<boolean> {
  if (!storedValue || typeof storedValue !== "string" || !inputPass) return false;

  // Case 1: PBKDF2 format
  if (storedValue.startsWith("pbkdf2:")) {
    const parts = storedValue.split(":");
    if (parts.length === 4) {
      const iterations = parseInt(parts[1], 10) || DEFAULT_ITERATIONS;
      const saltHex = parts[2];
      const targetHashHex = parts[3];

      const encoder = new TextEncoder();
      const salt = hexToBuffer(saltHex);

      const baseKey = await crypto.subtle.importKey(
        "raw",
        encoder.encode(inputPass),
        "PBKDF2",
        false,
        ["deriveBits"]
      );

      const derivedBits = await crypto.subtle.deriveBits(
        {
          name: "PBKDF2",
          salt: salt as unknown as ArrayBuffer,
          iterations,
          hash: HASH_ALGO,
        },
        baseKey,
        KEY_LEN_BITS
      );

      const computedHashHex = bufferToHex(derivedBits);
      return constantTimeEqual(computedHashHex, targetHashHex);
    }
  }

  // Case 2: Legacy SHA-256 (64 hex digits)
  if (storedValue.length === 64 && /^[0-9a-f]+$/i.test(storedValue)) {
    const legacyHash = await hashPasswordLegacy(inputPass);
    return constantTimeEqual(legacyHash.toLowerCase(), storedValue.toLowerCase());
  }

  // Strict: Reject any unhashed or plaintext format
  return false;
}

export interface SessionPayload {
  userKey: string;
  fullName: string;
  role: "admin" | "user" | "client";
  clientName?: string;
  exp: number;
}

export const SESSION_COOKIE_NAME = "faf_eudr_session";

/**
 * Generates an HMAC-SHA256 signed session token for secure HttpOnly cookies
 */
export async function createSessionToken(
  payload: Omit<SessionPayload, "exp">,
  durationSeconds = 7 * 24 * 60 * 60
): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + durationSeconds;
  const fullPayload: SessionPayload = { ...payload, exp };
  const payloadJson = JSON.stringify(fullPayload);
  const payloadB64 = btoa(unescape(encodeURIComponent(payloadJson)));

  const secret = await getSessionSecret();
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payloadB64));
  const sigHex = bufferToHex(signature);

  return `${payloadB64}.${sigHex}`;
}

/**
 * Verifies an HMAC-SHA256 signed session token and checks expiry
 */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  if (!token || !token.includes(".")) return null;
  const [payloadB64, sigHex] = token.split(".");
  if (!payloadB64 || !sigHex) return null;

  try {
    const secret = await getSessionSecret();
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const expectedSig = await crypto.subtle.sign("HMAC", key, encoder.encode(payloadB64));
    const expectedSigHex = bufferToHex(expectedSig);

    if (!constantTimeEqual(sigHex, expectedSigHex)) return null;

    const payloadJson = decodeURIComponent(escape(atob(payloadB64)));
    const payload = JSON.parse(payloadJson) as SessionPayload;

    const nowSec = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < nowSec) return null;

    return payload;
  } catch {
    return null;
  }
}

/**
 * Multi-Tenant & RBAC Storage Access Control with Segment-Based Validation
 * - mode: "read" | "write"
 * - Admins can read & write anywhere.
 * - Staff ('user') can read anywhere and write to operational folders (uploads, talhoes, contratos_clientes, publicados).
 * - Clients can ONLY read/write inside their own exact directory segments:
 *   e.g. `contratos_clientes/BELCO/file.geojson` or `publicados/BELCO/file.zip`.
 *   Strictly rejects partial substring matches like `contratos_clientes/BELCO_OTHER/`.
 */
export function isAuthorizedForStorageKey(
  userRole: "admin" | "user" | "client",
  userClientName: string | undefined,
  targetKey: string,
  mode: "read" | "write" = "read"
): boolean {
  if (userRole === "admin") return true;

  const normalizedKey = targetKey.replace(/\\/g, "/").replace(/^\/+/, "");
  const segments = normalizedKey.split("/").map((s) => s.trim().toUpperCase());

  if (userRole === "user") {
    if (mode === "read") return true;
    // Staff write restrictions: cannot overwrite system root indexes directly
    const allowedRoots = new Set(["UPLOADS", "TALHOES", "CONTRATOS_CLIENTES", "PUBLICADOS", "DOSSIES"]);
    return segments.length > 1 && allowedRoots.has(segments[0]);
  }

  if (userRole === "client") {
    if (!userClientName || !userClientName.trim()) return false;
    const cleanClient = userClientName.trim().toUpperCase();

    // Client public published plot index (read only)
    if (mode === "read" && normalizedKey.toUpperCase() === "CONTRATOS_CLIENTES/PUBLISHED_PLOTS_INDEX.JSON") {
      return true;
    }

    // Segment-based isolation: must be in CONTRATOS_CLIENTES/<CLIENT_NAME>/... or PUBLICADOS/<CLIENT_NAME>/...
    if (segments.length >= 2) {
      const root = segments[0];
      const clientFolder = segments[1];

      if ((root === "CONTRATOS_CLIENTES" || root === "PUBLICADOS") && clientFolder === cleanClient) {
        return true;
      }
    }

    return false;
  }

  return false;
}
