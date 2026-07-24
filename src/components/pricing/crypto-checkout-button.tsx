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

      const verifyRes = await fetch("/api/v1/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ txHash }),
      });
      const verifyBody = await verifyRes.json();

      if (!verifyRes.ok) {
        toast.error(verifyBody.error || "Payment verification failed");
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
