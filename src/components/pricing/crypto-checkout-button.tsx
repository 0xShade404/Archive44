"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { encodeFunctionData, parseUnits } from "viem";
import { Button } from "@/components/ui/button";
import { erc20TransferAbi, USDT_DECIMALS } from "@/lib/erc20";
import { Wallet } from "lucide-react";

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    };
  }
}

type PaymentToken = "ETH" | "USDT";
type Status = "idle" | "connecting" | "sending" | "confirming" | "done";

const POLL_INTERVAL_MS = 5_000;
const MAX_POLL_ATTEMPTS = 36; // ~3 minutes — comfortably covers mainnet confirmation times

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * The verify endpoint returns quickly (it can't block for a full confirmation
 * inside one serverless invocation), so a 202 means "still pending" rather
 * than an error — poll it instead of treating any 2xx as done.
 */
async function pollPaymentVerification(
  txHash: string,
  token: PaymentToken
): Promise<{ ok: boolean; body: Record<string, unknown> }> {
  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    const res = await fetch("/api/v1/payments/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ txHash, token }),
    });
    const body = await res.json();

    if (res.status === 202) {
      await sleep(POLL_INTERVAL_MS);
      continue;
    }

    return { ok: res.ok, body };
  }

  return { ok: false, body: { error: "Still confirming on-chain. Check back shortly — your plan will not be charged twice." } };
}

export function CryptoCheckoutButton() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const [status, setStatus] = useState<Status>("idle");
  const [token, setToken] = useState<PaymentToken>("ETH");

  async function handlePay() {
    if (sessionStatus !== "authenticated" || !session) {
      router.push("/auth/signin?callbackUrl=/pricing");
      return;
    }

    if (!window.ethereum) {
      toast.error("No wallet found. Install MetaMask or another injected wallet extension.");
      return;
    }

    try {
      const configRes = await fetch("/api/v1/payments/config");
      const config = await configRes.json();
      if (!configRes.ok) {
        toast.error(config.error || "Payments are not available right now");
        return;
      }

      if (token === "USDT" && !config.usdtContract) {
        toast.error("USDT payments are not configured yet");
        return;
      }

      setStatus("connecting");
      const accounts = (await window.ethereum.request({ method: "eth_requestAccounts" })) as string[];
      const from = accounts[0];
      if (!from) throw new Error("No account returned by wallet");

      setStatus("sending");

      let txHash: string;
      if (token === "ETH") {
        const valueWei = BigInt(Math.round(Number(config.amountEth) * 1e18));
        txHash = (await window.ethereum.request({
          method: "eth_sendTransaction",
          params: [{ from, to: config.wallet, value: `0x${valueWei.toString(16)}` }],
        })) as string;
      } else {
        const amountUnits = parseUnits(config.amountUsdt, USDT_DECIMALS);
        const data = encodeFunctionData({
          abi: erc20TransferAbi,
          functionName: "transfer",
          args: [config.wallet, amountUnits],
        });
        txHash = (await window.ethereum.request({
          method: "eth_sendTransaction",
          params: [{ from, to: config.usdtContract, data, value: "0x0" }],
        })) as string;
      }

      setStatus("confirming");
      toast.info("Transaction sent. Waiting for confirmation...");

      const { ok, body: verifyBody } = await pollPaymentVerification(txHash, token);

      if (!ok) {
        toast.error((verifyBody.error as string) || "Payment verification failed");
        setStatus("idle");
        return;
      }

      setStatus("done");
      toast.success("Payment confirmed! You're now on the Pro plan.");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Payment failed");
      setStatus("idle");
    }
  }

  const labels: Record<Status, string> = {
    idle: `Subscribe with ${token}`,
    connecting: "Connecting wallet...",
    sending: "Confirm in wallet...",
    confirming: "Confirming on-chain...",
    done: "Confirmed!",
  };

  return (
    <div className="space-y-2 w-full">
      <div className="flex gap-1 p-1 rounded-lg border border-white/10 bg-white/5">
        {(["ETH", "USDT"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setToken(t)}
            disabled={status !== "idle"}
            className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${
              token === t ? "bg-gold text-navy" : "text-muted-foreground hover:text-white"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      <Button className="w-full" size="lg" onClick={handlePay} disabled={status !== "idle"}>
        <Wallet className="h-4 w-4" />
        {labels[status]}
      </Button>
    </div>
  );
}
