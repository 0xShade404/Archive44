import { randomBytes, createHash } from "crypto";

export function generateApiKey(): { plaintext: string; hash: string } {
  const plaintext = `a44_${randomBytes(24).toString("hex")}`;
  return { plaintext, hash: hashApiKey(plaintext) };
}

export function hashApiKey(plaintext: string): string {
  return createHash("sha256").update(plaintext).digest("hex");
}
