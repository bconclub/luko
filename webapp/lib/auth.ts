// Session tokens: "<expiryEpochSeconds>.<base64url HMAC-SHA256 signature>".
// Uses Web Crypto (crypto.subtle) so this file works unmodified in both the
// Edge middleware runtime and Node.js route handlers.

const COOKIE_NAME = "luko_session";
const SESSION_DAYS = 30;

function b64urlEncode(bytes: ArrayBuffer): string {
  return Buffer.from(bytes)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function b64urlDecode(s: string): Uint8Array<ArrayBuffer> {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + pad;
  return Uint8Array.from(Buffer.from(b64, "base64"));
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("Missing SESSION_SECRET env var.");
  return secret;
}

export async function createSessionToken(): Promise<string> {
  const expiry = Math.floor(Date.now() / 1000) + SESSION_DAYS * 24 * 60 * 60;
  const key = await hmacKey(getSecret());
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(String(expiry)));
  return `${expiry}.${b64urlEncode(sig)}`;
}

export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const [expiryStr, sig] = token.split(".");
  if (!expiryStr || !sig) return false;
  const expiry = Number(expiryStr);
  if (!Number.isFinite(expiry) || expiry < Math.floor(Date.now() / 1000)) return false;
  const key = await hmacKey(getSecret());
  try {
    return await crypto.subtle.verify(
      "HMAC",
      key,
      b64urlDecode(sig),
      new TextEncoder().encode(expiryStr)
    );
  } catch {
    return false;
  }
}

export async function verifyPassword(candidate: string): Promise<boolean> {
  const stored = process.env.DASHBOARD_PASSWORD_HASH;
  if (!stored) throw new Error("Missing DASHBOARD_PASSWORD_HASH env var.");
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const salt = Uint8Array.from(Buffer.from(saltHex, "hex"));
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(candidate),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const derived = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 210_000, hash: "SHA-256" },
    keyMaterial,
    256
  );
  const derivedHex = Buffer.from(derived).toString("hex");
  // constant-time compare
  if (derivedHex.length !== hashHex.length) return false;
  let diff = 0;
  for (let i = 0; i < derivedHex.length; i++) diff |= derivedHex.charCodeAt(i) ^ hashHex.charCodeAt(i);
  return diff === 0;
}

export { COOKIE_NAME };
