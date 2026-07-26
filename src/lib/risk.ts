// Heuristic wallet risk scoring, computed from data already available via
// Moralis (no extra API calls needed). Returns 0-100, where higher means
// riskier. This is a starting heuristic, not a definitive fraud signal —
// intended to flag wallets worth a closer look, not to make accusations.
//
// NOTE on accuracy: true wallet age (first-ever transaction) would need a
// separate Moralis call we don't currently make. As a proxy, this uses the
// oldest transaction in the 10 most recent transactions we already fetch —
// meaningful for low-activity wallets, less precise for very active ones
// (where the 10th-most-recent tx could still be recent). Worth upgrading
// to a dedicated "first tx" lookup later if risk accuracy matters more.
//
// Factors considered:
// - Recent activity span: if even the oldest of the last 10 txs is very
//   recent, the wallet may be newly active — a common scam pattern.
// - Transaction count: extremely low activity (1-2 txs) on a wallet holding
//   meaningful value can indicate a single-use scam wallet.
// - Native balance: near-zero balance combined with token/NFT activity can
//   indicate a wallet that's been drained.

interface RiskInput {
  oldestKnownTxTimestamp: string | null; // ISO timestamp of oldest tx in the fetched batch
  txCount: number;
  nativeBalanceEth: number;
}

export function computeWalletRiskScore(input: RiskInput): number {
  let score = 0;

  // Recency factor (0-40 points): if all known activity is very recent,
  // treat as a mild risk signal (proxy for wallet age — see note above).
  if (input.oldestKnownTxTimestamp) {
    const ageMs = Date.now() - new Date(input.oldestKnownTxTimestamp).getTime();
    const ageDays = ageMs / (1000 * 60 * 60 * 24);
    if (ageDays < 7) score += 40;
    else if (ageDays < 30) score += 25;
    else if (ageDays < 90) score += 10;
  } else {
    // No transaction history at all is itself a mild signal.
    score += 15;
  }

  // Activity factor (0-30 points): very low tx count is riskier.
  if (input.txCount === 0) score += 30;
  else if (input.txCount < 3) score += 20;
  else if (input.txCount < 10) score += 10;

  // Balance factor (0-30 points): dust balance can indicate a drained
  // or pass-through wallet used briefly then abandoned.
  if (input.nativeBalanceEth < 0.0001) score += 30;
  else if (input.nativeBalanceEth < 0.001) score += 15;

  return Math.min(100, score);
}
