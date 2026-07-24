import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

const TTL_MS = 5 * 60 * 1000;

export async function createNonce(address: string): Promise<string> {
  const nonce = randomBytes(16).toString("hex");
  const expires = new Date(Date.now() + TTL_MS);

  await prisma.walletNonce.upsert({
    where: { address: address.toLowerCase() },
    update: { nonce, expires },
    create: { address: address.toLowerCase(), nonce, expires },
  });

  return nonce;
}

export function buildSignMessage(address: string, nonce: string): string {
  return `Sign in to Archive44\n\nAddress: ${address}\nNonce: ${nonce}`;
}

export async function consumeNonce(address: string): Promise<string | null> {
  const key = address.toLowerCase();
  const entry = await prisma.walletNonce.findUnique({ where: { address: key } });
  if (!entry) return null;

  await prisma.walletNonce.delete({ where: { address: key } }).catch(() => {});

  if (entry.expires < new Date()) return null;
  return entry.nonce;
}
