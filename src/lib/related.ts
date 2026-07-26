import type { WalletProfile } from "./wallet";

/**
 * Extracts unique counterparty addresses from a wallet's recent transactions
 * — powers the "Related Entities" feature by surfacing other wallets this
 * one has directly interacted with. Limited to the same 10-transaction
 * window as the rest of the wallet profile, so this reflects recent
 * activity, not full history.
 */
export function extractRelatedWallets(
  profile: WalletProfile,
  address: string
): string[] {
  const related = new Set<string>();

  for (const tx of profile.recentTransactions) {
    const counterparty =
      tx.from.toLowerCase() === address.toLowerCase() ? tx.to : tx.from;
    if (counterparty && counterparty.toLowerCase() !== address.toLowerCase()) {
      related.add(counterparty);
    }
  }

  return Array.from(related);
}
