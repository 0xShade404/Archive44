import Moralis, { initMoralis } from "./moralis";
import { EvmChain } from "@moralisweb3/common-evm-utils";

// Map your app's chain names to Moralis chain constants.
// Extend this as you support more networks.
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
    usdValue: number | null;
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

  return {
    address,
    chain: chainName,
    nativeBalance: nativeBalance.result.balance.ether,
    netWorthUsd: netWorth ? Number(netWorth.result.total_networth_usd) : null,
    tokens: tokenBalances.result.map((t) => ({
      symbol: t.symbol ?? "?",
      name: t.name ?? "Unknown Token",
      balance: t.balance.ether,
      usdValue: null, // enrich with token.getTokenPrice per-symbol if needed
      contractAddress: t.tokenAddress.checksum,
    })),
    nfts: nfts.result.map((n) => ({
      name: n.name ?? null,
      tokenId: n.tokenId,
      contractAddress: n.tokenAddress.checksum,
      imageUrl: n.result?.media?.originalMediaUrl ?? null,
    })),
    recentTransactions: transactions.result.map((tx) => ({
      hash: tx.hash,
      from: tx.fromAddress.checksum,
      to: tx.toAddress?.checksum ?? "",
      value: tx.value?.toString() ?? "0",
      timestamp: tx.blockTimestamp.toISOString(),
    })),
  };
}
