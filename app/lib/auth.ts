/**
 * Secure PBKDF2 Password Hashing & Verification (WebCrypto API)
 * 100% Native to Edge Runtimes (Cloudflare Workers / Browser / Node.js)
 */

const ITERATIONS = 100_000;
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
 * Generates a cryptographically secure PBKDF2-HMAC-SHA512 hash with unique 16-byte salt
 * Output format: pbkdf2:100000:<salt_hex>:<hash_hex>
 */
export async function hashPassword(password: string): Promise<string> {
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
      iterations: ITERATIONS,
      hash: HASH_ALGO,
    },
    baseKey,
    KEY_LEN_BITS
  );

  const saltHex = bufferToHex(salt.buffer as ArrayBuffer);
  const hashHex = bufferToHex(derivedBits);

  return `pbkdf2:${ITERATIONS}:${saltHex}:${hashHex}`;
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
 * Constant-time comparison between two strings
 */
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Verifies password match against:
 * 1. Modern PBKDF2 (pbkdf2:100000:salt:hash)
 * 2. Legacy SHA-256 (64 hex characters)
 * 3. Plaintext fallback (if unhashed initial state)
 */
export async function checkPasswordMatch(inputPass: string, storedValue: string): Promise<boolean> {
  if (!storedValue || typeof storedValue !== "string") return false;

  // Case 1: PBKDF2 format
  if (storedValue.startsWith("pbkdf2:")) {
    const parts = storedValue.split(":");
    if (parts.length === 4) {
      const iterations = parseInt(parts[1], 10) || ITERATIONS;
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

  // Case 3: Plaintext initial match
  return constantTimeEqual(inputPass, storedValue);
}

export interface SessionPayload {
  userKey: string;
  fullName: string;
  role: "admin" | "user" | "client";
  clientName?: string;
  exp: number;
}

export const SESSION_COOKIE_NAME = "faf_eudr_session";
const SESSION_SECRET = "FAF_EUDR_HMAC_SESSION_SECRET_2026_PROD_KEY";

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

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(SESSION_SECRET),
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
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(SESSION_SECRET),
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

