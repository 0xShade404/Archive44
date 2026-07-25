import Moralis, { initMoralis } from "./moralis";
import { EvmChain } from "@moralisweb3/common-evm-utils";

const CHAIN_MAP: Record<string, EvmChain> = {
  ethereum: EvmChain.ETHEREUM,
  base: EvmChain.BASE,
  polygon: EvmChain.POLYGON,
  bsc: EvmChain.BSC,
  arbitrum: EvmChain.ARBITRUM,
};

export interface TokenProfile {
  address: string;
  chain: string;
  name: string;
  symbol: string;
  decimals: number;
  priceUsd: number | null;
  logoUrl: string | null;
  recentTransfers: {
    hash: string;
    from: string;
    to: string;
    value: string;
    timestamp: string;
  }[];
}

// Shapes below match Moralis's documented raw JSON API responses
// (snake_case), which are stable across SDK versions — see note in wallet.ts.
interface RawTokenMetadata {
  name: string | null;
  symbol: string | null;
  decimals: string | null;
  logo: string | null;
}

interface RawTokenPrice {
  usdPrice: number;
}

interface RawTokenTransfer {
  transaction_hash: string;
  from_address: string;
  to_address: string;
  value: string;
  block_timestamp: string;
}

/**
 * Pulls token metadata, live USD price, and recent transfer activity.
 * Feeds Archive44's token entity pages and risk-scoring inputs.
 */
export async function getTokenProfile(
  contractAddress: string,
  chainName: keyof typeof CHAIN_MAP = "ethereum"
): Promise<TokenProfile> {
  await initMoralis();
  const chain = CHAIN_MAP[chainName];
  if (!chain) throw new Error(`Unsupported chain: ${chainName}`);

  const [metadata, price, transfers] = await Promise.all([
    Moralis.EvmApi.token.getTokenMetadata({
      addresses: [contractAddress],
      chain,
    }),
    Moralis.EvmApi.token
      .getTokenPrice({ address: contractAddress, chain })
      .catch(() => null), // not all tokens have price data (e.g. low liquidity)
    Moralis.EvmApi.token.getTokenTransfers({
      address: contractAddress,
      chain,
      limit: 10,
    }),
  ]);

  const metaRaw = metadata.raw[0] as unknown as RawTokenMetadata;
  const priceRaw = price ? (price.raw as unknown as RawTokenPrice) : null;
  const transfersRaw = transfers.raw.result as unknown as RawTokenTransfer[];

  return {
    address: contractAddress,
    chain: chainName,
    name: metaRaw.name ?? "Unknown Token",
    symbol: metaRaw.symbol ?? "?",
    decimals: Number(metaRaw.decimals ?? 18),
    priceUsd: priceRaw ? priceRaw.usdPrice : null,
    logoUrl: metaRaw.logo ?? null,
    recentTransfers: transfersRaw.map((t) => ({
      hash: t.transaction_hash,
      from: t.from_address,
      to: t.to_address,
      value: t.value,
      timestamp: t.block_timestamp,
    })),
  };
}
