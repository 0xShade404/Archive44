"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
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

export function WalletConnectButton({ callbackUrl = "/dashboard" }: { callbackUrl?: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleConnect() {
    if (!window.ethereum) {
      toast.error("No wallet found. Install MetaMask or another injected wallet extension.");
      return;
    }

    setLoading(true);
    try {
      const accounts = (await window.ethereum.request({
        method: "eth_requestAccounts",
      })) as string[];
      const address = accounts[0];
      if (!address) throw new Error("No account returned by wallet");

      const nonceRes = await fetch(`/api/auth/wallet/nonce?address=${address}`);
      if (!nonceRes.ok) throw new Error("Failed to fetch sign-in challenge");
      const { message } = await nonceRes.json();

      const signature = (await window.ethereum.request({
        method: "personal_sign",
        params: [message, address],
      })) as string;

      const result = await signIn("wallet", {
        address,
        signature,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        toast.error("Wallet sign-in failed. Please try again.");
      } else {
        toast.success("Signed in with wallet");
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Wallet sign-in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="outline" className="w-full" type="button" onClick={handleConnect} disabled={loading}>
      <Wallet className="h-4 w-4" />
      {loading ? "Connecting..." : "Continue with Wallet"}
    </Button>
  );
}
