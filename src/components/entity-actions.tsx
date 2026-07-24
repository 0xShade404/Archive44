"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Star, Bell } from "lucide-react";

type EntityKind = "wallet" | "token" | "protocol" | "founder";

export function EntityActions({
  kind,
  identifier,
  chain,
}: {
  kind: EntityKind;
  identifier: string;
  chain?: string;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [alerting, setAlerting] = useState(false);
  const canSave = kind === "wallet" || kind === "token";

  async function handleUnauthorized() {
    toast.error("Sign in to use this feature");
    router.push(`/auth/signin?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const endpoint = kind === "wallet" ? "/api/v1/saved-wallets" : "/api/v1/saved-tokens";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(kind === "wallet" ? { address: identifier } : { address: identifier, chain }),
      });

      if (res.status === 401) return handleUnauthorized();
      if (!res.ok) throw new Error();

      toast.success(`${kind === "wallet" ? "Wallet" : "Token"} saved`);
    } catch {
      toast.error("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAlert() {
    setAlerting(true);
    try {
      const res = await fetch("/api/v1/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: kind, target: identifier }),
      });

      if (res.status === 401) return handleUnauthorized();
      if (!res.ok) throw new Error();

      toast.success("Alert created");
    } catch {
      toast.error("Failed to create alert. Please try again.");
    } finally {
      setAlerting(false);
    }
  }

  return (
    <div className="flex gap-2">
      {canSave && (
        <Button variant="outline" size="sm" onClick={handleSave} disabled={saving}>
          <Star className="h-4 w-4" /> {saving ? "Saving..." : "Save"}
        </Button>
      )}
      <Button variant="outline" size="sm" onClick={handleAlert} disabled={alerting}>
        <Bell className="h-4 w-4" /> {alerting ? "Creating..." : "Alert"}
      </Button>
    </div>
  );
}
