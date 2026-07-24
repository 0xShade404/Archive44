"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Trash2 } from "lucide-react";

type ApiKey = {
  id: string;
  name: string;
  isActive: boolean;
  lastUsed: string | null;
  requests: number;
  createdAt: string;
};

export function ApiKeysManager({ initialKeys }: { initialKeys: ApiKey[] }) {
  const router = useRouter();
  const [keys, setKeys] = useState(initialKeys);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);

  async function handleCreate() {
    if (!name.trim()) {
      toast.error("Give your API key a name");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/v1/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const body = await res.json();
      if (!res.ok) {
        toast.error(body.error || "Failed to create API key");
        return;
      }
      setKeys((prev) => [{ ...body.apiKey, lastUsed: null, requests: 0 }, ...prev]);
      setNewKey(body.key);
      setName("");
    } finally {
      setCreating(false);
    }
  }

  async function handleToggle(id: string, isActive: boolean) {
    const res = await fetch(`/api/v1/api-keys/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive }),
    });
    if (!res.ok) {
      toast.error("Failed to update key");
      return;
    }
    setKeys((prev) => prev.map((k) => (k.id === id ? { ...k, isActive } : k)));
    router.refresh();
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/v1/api-keys/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Failed to delete key");
      return;
    }
    setKeys((prev) => prev.filter((k) => k.id !== id));
    toast.success("API key deleted");
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create API Key</CardTitle>
          <CardDescription>Used with `Authorization: Bearer &lt;key&gt;` against /api/v1/search</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {newKey && (
            <div className="p-3 rounded-lg border border-gold/30 bg-gold/5 text-sm space-y-1">
              <p className="text-muted-foreground">
                Copy this key now — it won&apos;t be shown again.
              </p>
              <code className="block font-mono text-gold break-all">{newKey}</code>
            </div>
          )}
          <div className="flex gap-2">
            <Input
              placeholder="e.g. Production server"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? "Creating..." : "Create"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your API Keys</CardTitle>
        </CardHeader>
        <CardContent>
          {keys.length === 0 ? (
            <p className="text-sm text-muted-foreground">No API keys yet.</p>
          ) : (
            <ul className="space-y-3">
              {keys.map((key) => (
                <li
                  key={key.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-white/10"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{key.name}</span>
                      <Badge variant={key.isActive ? "success" : "outline"}>
                        {key.isActive ? "Active" : "Revoked"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {key.requests} requests
                      {key.lastUsed ? ` · last used ${new Date(key.lastUsed).toLocaleDateString()}` : ""}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggle(key.id, !key.isActive)}
                    >
                      {key.isActive ? "Revoke" : "Reactivate"}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(key.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
