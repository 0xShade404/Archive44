import Moralis, { initMoralis } from "./moralis";

// Solana token lookups use Moralis's separate Solana API (Moralis.SolApi),
// distinct from the EVM API used elsewhere in lib/wallet.ts and lib/token.ts.
// Solana addresses are base58-encoded and don't share the 0x-prefixed
// format EVM chains use, so they need entirely separate handling.

export interface SolanaTokenProfile {
  address: string;
  chain: "solana";
  name: string;
  symbol: string;
  decimals: number;
  priceUsd: number | null;
  logoUrl: string | null;
}

// Matches Moralis's documented raw JSON shape for Solana token metadata —
// same approach as lib/wallet.ts and lib/token.ts: read .raw (stable public
// API field names) rather than the SDK's internal typed .result classes.
interface RawSolTokenMetadata {
  name: string | null;
  symbol: string | null;
  logo: string | null;
  decimals: string | null;
}

interface RawSolTokenPrice {
  usdPrice: number;
}

export async function getSolanaTokenProfile(
  address: string
): Promise<SolanaTokenProfile> {
  await initMoralis();

  const [metadata, price] = await Promise.all([
    Moralis.SolApi.token.getTokenMetadata({ network: "mainnet", address }),
    Moralis.SolApi.token
      .getTokenPrice({ network: "mainnet", address })
      .catch(() => null), // not all SPL tokens have price data
  ]);

  const metaRaw = metadata.raw as unknown as RawSolTokenMetadata;
  const priceRaw = price ? (price.raw as unknown as RawSolTokenPrice) : null;

  return {
    address,
    chain: "solana",
    name: metaRaw.name ?? "Unknown Token",
    symbol: metaRaw.symbol ?? "?",
    decimals: Number(metaRaw.decimals ?? 9),
    priceUsd: priceRaw ? priceRaw.usdPrice : null,
    logoUrl: metaRaw.logo ?? null,
  };
}

export interface SolanaWalletProfile {
  address: string;
  chain: "solana";
  nativeBalanceSol: string;
  tokens: {
    symbol: string;
    name: string;
    balance: string;
    mint: string;
  }[];
}

interface RawSolBalance {
  solana: string;
}

interface RawSolPortfolioToken {
  mint: string;
  amount: string;
  name: string | null;
  symbol: string | null;
}

/**
 * Pulls a Solana wallet's native SOL balance and SPL token holdings.
 * Note: unlike the EVM wallet lookup, Moralis does not offer general
 * transaction history for Solana, so no timeline/activity data is available
 * here — only current balance and holdings.
 */
export async function getSolanaWalletProfile(
  address: string
): Promise<SolanaWalletProfile> {
  await initMoralis();

  const [balance, portfolio] = await Promise.all([
    Moralis.SolApi.account.balance({ network: "mainnet", address }),
    Moralis.SolApi.account
      .getPortfolio({ network: "mainnet", address })
      .catch(() => null),
  ]);

  const balanceRaw = balance.raw as unknown as RawSolBalance;
  const tokensRaw = portfolio
    ? ((portfolio.raw as unknown as { tokens?: RawSolPortfolioToken[] }).tokens ?? [])
    : [];

  return {
    address,
    chain: "solana",
    nativeBalanceSol: balanceRaw.solana,
    tokens: tokensRaw.map((t) => ({
      symbol: t.symbol ?? "?",
      name: t.name ?? "Unknown Token",
      balance: t.amount,
      mint: t.mint,
    })),
  };
}
