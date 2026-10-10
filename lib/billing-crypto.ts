import { env } from "cloudflare:workers";

function bytesToB64(bytes: Uint8Array) {
  let value = "";
  bytes.forEach((byte) => (value += String.fromCharCode(byte)));
  return btoa(value);
}

function b64ToBytes(value: string) {
  return Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
}

async function key() {
  if (!env.BILLING_ENCRYPTION_KEY) throw new Error("BILLING_ENCRYPTION_KEY is not configured");
  const raw = b64ToBytes(env.BILLING_ENCRYPTION_KEY);
  if (raw.byteLength !== 32) throw new Error("BILLING_ENCRYPTION_KEY must be a base64 encoded 32-byte key");
  return crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt", "decrypt"]);
}

export async function encryptBillingKey(value: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await key(), new TextEncoder().encode(value)));
  return `${bytesToB64(iv)}.${bytesToB64(encrypted)}`;
}

export async function decryptBillingKey(value: string) {
  const [iv, encrypted] = value.split(".");
  if (!iv || !encrypted) throw new Error("Invalid encrypted billing key");
  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv: b64ToBytes(iv) }, await key(), b64ToBytes(encrypted));
  return new TextDecoder().decode(decrypted);
}
