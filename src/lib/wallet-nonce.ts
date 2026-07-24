import { randomBytes } from "crypto";

/**
 * In-memory nonce store for wallet sign-in challenges. Single-instance only —
 * a multi-instance deployment should move this to Redis or the database.
 */
const nonces = new Map<string, { nonce: string; expires: number }>();

const TTL_MS = 5 * 60 * 1000;

export function createNonce(address: string): string {
  const nonce = randomBytes(16).toString("hex");
  nonces.set(address.toLowerCase(), { nonce, expires: Date.now() + TTL_MS });
  return nonce;
}

export function buildSignMessage(address: string, nonce: string): string {
  return `Sign in to Archive44\n\nAddress: ${address}\nNonce: ${nonce}`;
}

export function consumeNonce(address: string): string | null {
  const entry = nonces.get(address.toLowerCase());
  if (!entry) return null;
  nonces.delete(address.toLowerCase());
  if (entry.expires < Date.now()) return null;
  return entry.nonce;
}
