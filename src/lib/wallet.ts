import Moralis, { initMoralis } from "./moralis";
import { EvmChain } from "@moralisweb3/common-evm-utils";

const CHAIN_MAP: Record<string, EvmChain> = {
  ethereum: EvmChain.ETHEREUM,
  base: EvmChain.BASE,
  polygon: EvmChain.POLYGON,
  bsc: EvmChain.BSC,
  arbitrum: EvmChain.ARBITRUM,
};

export interface WalletProfile {
  address: string;
  chain: string;
  nativeBalance: string;
  netWorthUsd: number | null;
  tokens: {
    symbol: string;
    name: string;
    balance: string;
    contractAddress: string;
  }[];
  nfts: {
    name: string | null;
    tokenId: string;
    contractAddress: string;
    imageUrl: string | null;
  }[];
  recentTransactions: {
    hash: string;
    from: string;
    to: string;
    value: string;
    timestamp: string;
  }[];
}

// Shapes below match Moralis's documented raw JSON API responses
// (snake_case), which are stable across SDK versions — unlike the SDK's
// internal typed `.result` classes, which have changed field names
// between versions (native_balance vs balance.ether, total_networth_usd
// vs totalNetworthUsd, etc).
interface RawTokenBalance {
  token_address: string;
  symbol: string | null;
  name: string | null;
  balance: string;
}

interface RawNft {
  token_address: string;
  token_id: string;
  name: string | null;
  normalized_metadata?: { image?: string | null } | null;
}

interface RawTransaction {
  hash: string;
  from_address: string;
  to_address: string | null;
  value: string;
  block_timestamp: string;
}

interface RawNetWorth {
  total_networth_usd: string;
}

/**
 * Pulls a full wallet profile from Moralis: native balance, ERC-20 holdings,
 * NFTs, and recent transaction history. This is the core data feed for
 * Archive44's wallet entity pages.
 */
export async function getWalletProfile(
  address: string,
  chainName: keyof typeof CHAIN_MAP = "ethereum"
): Promise<WalletProfile> {
  await initMoralis();
  const chain = CHAIN_MAP[chainName];
  if (!chain) throw new Error(`Unsupported chain: ${chainName}`);

  const [nativeBalance, tokenBalances, nfts, netWorth, transactions] =
    await Promise.all([
      Moralis.EvmApi.balance.getNativeBalance({ address, chain }),
      Moralis.EvmApi.token.getWalletTokenBalances({ address, chain }),
      Moralis.EvmApi.nft.getWalletNFTs({ address, chain, limit: 25 }),
      Moralis.EvmApi.wallets
        .getWalletNetWorth({ address, chains: [chain] })
        .catch(() => null), // net worth endpoint can be flaky per-chain
      Moralis.EvmApi.transaction.getWalletTransactions({
        address,
        chain,
        limit: 10,
      }),
    ]);

  const tokensRaw = tokenBalances.raw as unknown as RawTokenBalance[];
  const nftsRaw = nfts.raw.result as unknown as RawNft[];
  const txRaw = transactions.raw.result as unknown as RawTransaction[];
  const netWorthRaw = netWorth
    ? (netWorth.raw as unknown as RawNetWorth)
    : null;

  return {
    address,
    chain: chainName,
    nativeBalance: nativeBalance.result.balance.ether,
    netWorthUsd: netWorthRaw ? Number(netWorthRaw.total_networth_usd) : null,
    tokens: tokensRaw.map((t) => ({
      symbol: t.symbol ?? "?",
      name: t.name ?? "Unknown Token",
      balance: t.balance,
      contractAddress: t.token_address,
    })),
    nfts: nftsRaw.map((n) => ({
      name: n.name ?? null,
      tokenId: n.token_id,
      contractAddress: n.token_address,
      imageUrl: n.normalized_metadata?.image ?? null,
    })),
    recentTransactions: txRaw.map((tx) => ({
      hash: tx.hash,
      from: tx.from_address,
      to: tx.to_address ?? "",
      value: tx.value,
      timestamp: tx.block_timestamp,
    })),
  };
}
