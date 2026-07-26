// Token holder statistics via Moralis's REST API directly (not the JS SDK).
// This endpoint was added relatively recently (Feb 2025) and isn't
// consistently wrapped by every SDK version, so we call the documented
// REST endpoint directly with fetch — same MORALIS_API_KEY, no extra
// dependency, and immune to SDK method-name drift between versions.

const MORALIS_BASE = "https://deep-index.moralis.io/api/v2.2";

// Moralis's REST chain parameter uses "eth" for Ethereum mainnet, but our
// app's chain names use "ethereum" — map between the two here.
const CHAIN_PARAM_MAP: Record<string, string> = {
  ethereum: "eth",
  base: "base",
  polygon: "polygon",
  bsc: "bsc",
  arbitrum: "arbitrum",
};

export interface TokenHolderStats {
  totalHolders: number;
  top10SupplyPercent: number | null;
  top25SupplyPercent: number | null;
  whales: number;
  sharks: number;
  dolphins: number;
  fish: number;
  shrimps: number;
  holderChange24h: number | null;
  holderChangePercent24h: number | null;
}

/**
 * Fetches holder distribution stats for an ERC-20 token — total holder
 * count, concentration among top holders, and a size-based breakdown
 * (whales/sharks/dolphins/fish/shrimps). Returns null if Moralis has no
 * holder data for this token yet (common for very new or illiquid tokens),
 * rather than throwing — this is supplementary data, not critical path.
 */
export async function getTokenHolderStats(
  address: string,
  chainName: keyof typeof CHAIN_PARAM_MAP = "ethereum"
): Promise<TokenHolderStats | null> {
  const apiKey = process.env.MORALIS_API_KEY;
  if (!apiKey) {
    throw new Error(
      "MORALIS_API_KEY is not set. Add it in your deployment platform's environment variables."
    );
  }

  const chainParam = CHAIN_PARAM_MAP[chainName];
  if (!chainParam) return null;

  const res = await fetch(
    `${MORALIS_BASE}/erc20/${address}/holders?chain=${chainParam}`,
    {
      headers: {
        "X-API-Key": apiKey,
        accept: "application/json",
      },
    }
  );

  if (!res.ok) {
    // 404 (no data yet) is expected for many tokens — not an error worth surfacing.
    if (res.status === 404) return null;
    throw new Error(`Moralis holder stats request failed: ${res.status}`);
  }

  const data = await res.json();

  return {
    totalHolders: Number(data.totalHolders) || 0,
    top10SupplyPercent: data.holderSupply?.top10?.supplyPercent ?? null,
    top25SupplyPercent: data.holderSupply?.top25?.supplyPercent ?? null,
    whales: data.holderDistribution?.whales ?? 0,
    sharks: data.holderDistribution?.sharks ?? 0,
    dolphins: data.holderDistribution?.dolphins ?? 0,
    fish: data.holderDistribution?.fish ?? 0,
    shrimps: data.holderDistribution?.shrimps ?? 0,
    holderChange24h: data.holderChange?.["24h"]?.change ?? null,
    holderChangePercent24h: data.holderChange?.["24h"]?.changePercent ?? null,
  };
}
