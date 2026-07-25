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
  priceChange24h: number | null;
  logoUrl: string | null;
  recentTransfers: {
    hash: string;
    from: string;
    to: string;
    value: string;
    timestamp: string;
  }[];
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

  // This SDK version wraps token fields under `.token`, not flat on the result item.
  const entry = metadata.result[0];
  const meta = entry.token;

  return {
    address: contractAddress,
    chain: chainName,
    name: meta.name ?? "Unknown Token",
    symbol: meta.symbol ?? "?",
    decimals: Number(meta.decimals ?? 18),
    priceUsd: price ? price.result.usdPrice : null,
    priceChange24h: price
      ? price.result["24hrPercentChange"]
        ? Number(price.result["24hrPercentChange"])
        : null
      : null,
    logoUrl: meta.logo ?? null,
    recentTransfers: transfers.result.map((t) => ({
      hash: t.transactionHash,
      from: t.fromAddress.checksum,
      to: t.toAddress.checksum,
      value: t.value?.toString() ?? "0",
      timestamp: t.blockTimestamp.toISOString(),
    })),
  };
}
