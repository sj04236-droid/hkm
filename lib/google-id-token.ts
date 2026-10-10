import { env } from "cloudflare:workers";

export type GoogleClaims = { sub: string; email: string; email_verified: boolean; name?: string; picture?: string; aud: string; iss: string; exp: number };

function decodePart(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "="));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

export async function verifyGoogleIdToken(token: string): Promise<GoogleClaims> {
  if (!env.GOOGLE_CLIENT_ID) throw new Error("GOOGLE_CLIENT_ID is not configured");
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Invalid Google credential");
  const header = JSON.parse(new TextDecoder().decode(decodePart(parts[0]))) as { alg: string; kid: string };
  const claims = JSON.parse(new TextDecoder().decode(decodePart(parts[1]))) as GoogleClaims;
  if (header.alg !== "RS256" || !header.kid) throw new Error("Unsupported Google credential");
  const response = await fetch("https://www.googleapis.com/oauth2/v3/certs");
  if (!response.ok) throw new Error("Google verification keys are unavailable");
  const { keys } = (await response.json()) as { keys: JsonWebKey[] };
  const jwk = keys.find((key) => key.kid === header.kid);
  if (!jwk) throw new Error("Google verification key was not found");
  const key = await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
  const valid = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, decodePart(parts[2]), new TextEncoder().encode(`${parts[0]}.${parts[1]}`));
  const now = Math.floor(Date.now() / 1000);
  if (!valid || claims.aud !== env.GOOGLE_CLIENT_ID || !["accounts.google.com", "https://accounts.google.com"].includes(claims.iss) || claims.exp <= now || !claims.sub || !claims.email || !claims.email_verified) throw new Error("Google credential validation failed");
  return claims;
}
