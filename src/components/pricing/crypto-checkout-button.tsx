"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    };
  }
}

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
async function pollPaymentVerification(txHash: string): Promise<{ ok: boolean; body: Record<string, unknown> }> {
  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    const res = await fetch("/api/v1/payments/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ txHash }),
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

      setStatus("connecting");
      const accounts = (await window.ethereum.request({ method: "eth_requestAccounts" })) as string[];
      const from = accounts[0];
      if (!from) throw new Error("No account returned by wallet");

      const valueWei = BigInt(Math.round(Number(config.amountEth) * 1e18));

      setStatus("sending");
      const txHash = (await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [
          {
            from,
            to: config.wallet,
            value: `0x${valueWei.toString(16)}`,
          },
        ],
      })) as string;

      setStatus("confirming");
      toast.info("Transaction sent. Waiting for confirmation...");

      const { ok, body: verifyBody } = await pollPaymentVerification(txHash);

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
    idle: "Subscribe with Crypto",
    connecting: "Connecting wallet...",
    sending: "Confirm in wallet...",
    confirming: "Confirming on-chain...",
    done: "Confirmed!",
  };

  return (
    <Button className="w-full" size="lg" onClick={handlePay} disabled={status !== "idle"}>
      <Wallet className="h-4 w-4" />
      {labels[status]}
    </Button>
  );
}
