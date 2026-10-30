// Admin session cookie: a signed token instead of the password itself.
//
// The cookie value is "<expiry>.<signature>": the expiry (seconds since 1970) and
// an HMAC-SHA256 of it. The key is derived from ADMIN_PASSWORD, so no extra
// setting is needed, and changing the password signs every session out. A leaked
// cookie no longer reveals the password and stops working when it expires.
//
// Web Crypto is used so this runs in proxy.js, route handlers and server
// components alike. crypto.subtle.verify compares in constant time.

export const SESSION_COOKIE = "admin_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

const encoder = new TextEncoder();

function toBase64Url(bytes) {
  let binary = "";
  for (const b of new Uint8Array(bytes)) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(text) {
  const padded = text.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (text.length % 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

async function getKey() {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return null;
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(`peoplelens-admin-session-v1:${password}`),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function createSessionToken(now = Date.now()) {
  const key = await getKey();
  if (!key) throw new Error("ADMIN_PASSWORD is not set");
  const expires = Math.floor(now / 1000) + SESSION_MAX_AGE_SECONDS;
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(`v1.${expires}`));
  return `${expires}.${toBase64Url(signature)}`;
}

export async function verifySessionToken(token, now = Date.now()) {
  if (!token || typeof token !== "string") return false;
  const [expiresText, signatureText, extra] = token.split(".");
  if (!expiresText || !signatureText || extra !== undefined) return false;

  const expires = Number(expiresText);
  if (!Number.isInteger(expires) || expires * 1000 < now) return false;

  const key = await getKey();
  if (!key) return false;

  let signature;
  try {
    signature = fromBase64Url(signatureText);
  } catch {
    return false;
  }
  return crypto.subtle.verify("HMAC", key, signature, encoder.encode(`v1.${expires}`));
}
