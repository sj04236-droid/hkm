import { cookies } from "next/headers";
import { env } from "cloudflare:workers";

const COOKIE = "atr_session";
const encoder = new TextEncoder();

export type SessionUser = { id: string; email: string; name: string };

function b64url(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((value) => (binary += String.fromCharCode(value)));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "="));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function sign(value: string) {
  if (!env.SESSION_SECRET) throw new Error("SESSION_SECRET is not configured");
  const key = await crypto.subtle.importKey("raw", encoder.encode(env.SESSION_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64url(new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(value))));
}

export async function createSession(user: SessionUser) {
  const payload = b64url(encoder.encode(JSON.stringify({ ...user, exp: Date.now() + 1000 * 60 * 60 * 24 * 30 })));
  const value = `${payload}.${await sign(payload)}`;
  (await cookies()).set(COOKIE, value, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
}

export async function clearSession() {
  (await cookies()).set(COOKIE, "", { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 0 });
}

export async function getSession(): Promise<SessionUser | null> {
  try {
    const value = (await cookies()).get(COOKIE)?.value;
    if (!value) return null;
    const [payload, signature] = value.split(".");
    if (!payload || !signature || (await sign(payload)) !== signature) return null;
    const data = JSON.parse(new TextDecoder().decode(fromB64url(payload)));
    if (!data.id || !data.email || !data.name || data.exp < Date.now()) return null;
    return { id: data.id, email: data.email, name: data.name };
  } catch {
    return null;
  }
}
