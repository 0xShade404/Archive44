"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Plus } from "lucide-react";

type WatchlistItem = { type: "wallet" | "token" | "protocol" | "founder"; target: string };
type Watchlist = { id: string; name: string; items: WatchlistItem[]; createdAt: string };

const ENTITY_TYPES: WatchlistItem["type"][] = ["wallet", "token", "protocol", "founder"];

function entityHref(item: WatchlistItem): string {
  return `/${item.type}/${item.target}`;
}

export function WatchlistsManager({ initialWatchlists }: { initialWatchlists: Watchlist[] }) {
  const [watchlists, setWatchlists] = useState(initialWatchlists);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  async function handleCreate() {
    if (!newName.trim()) {
      toast.error("Give your watchlist a name");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/v1/watchlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });
      const body = await res.json();
      if (!res.ok) {
        toast.error(body.error || "Failed to create watchlist");
        return;
      }
      setWatchlists((prev) => [{ ...body.watchlist, items: [] }, ...prev]);
      setNewName("");
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteWatchlist(id: string) {
    const res = await fetch(`/api/v1/watchlists/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Failed to delete watchlist");
      return;
    }
    setWatchlists((prev) => prev.filter((w) => w.id !== id));
  }

  async function handleAddItem(watchlistId: string, type: WatchlistItem["type"], target: string) {
    if (!target.trim()) return;
    const res = await fetch(`/api/v1/watchlists/${watchlistId}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, target: target.trim() }),
    });
    const body = await res.json();
    if (!res.ok) {
      toast.error(body.error || "Failed to add item");
      return;
    }
    setWatchlists((prev) => prev.map((w) => (w.id === watchlistId ? body.watchlist : w)));
  }

  async function handleRemoveItem(watchlistId: string, item: WatchlistItem) {
    const res = await fetch(`/api/v1/watchlists/${watchlistId}/items`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    });
    const body = await res.json();
    if (!res.ok) {
      toast.error(body.error || "Failed to remove item");
      return;
    }
    setWatchlists((prev) => prev.map((w) => (w.id === watchlistId ? body.watchlist : w)));
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>New Watchlist</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Input
            placeholder="e.g. DeFi founders to watch"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <Button onClick={handleCreate} disabled={creating}>
            {creating ? "Creating..." : "Create"}
          </Button>
        </CardContent>
      </Card>

      {watchlists.length === 0 ? (
        <p className="text-sm text-muted-foreground">No watchlists yet.</p>
      ) : (
        watchlists.map((watchlist) => (
          <WatchlistCard
            key={watchlist.id}
            watchlist={watchlist}
            onDelete={() => handleDeleteWatchlist(watchlist.id)}
            onAddItem={(type, target) => handleAddItem(watchlist.id, type, target)}
            onRemoveItem={(item) => handleRemoveItem(watchlist.id, item)}
          />
        ))
      )}
    </div>
  );
}

function WatchlistCard({
  watchlist,
  onDelete,
  onAddItem,
  onRemoveItem,
}: {
  watchlist: Watchlist;
  onDelete: () => void;
  onAddItem: (type: WatchlistItem["type"], target: string) => void;
  onRemoveItem: (item: WatchlistItem) => void;
}) {
  const [type, setType] = useState<WatchlistItem["type"]>("wallet");
  const [target, setTarget] = useState("");

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>{watchlist.name}</CardTitle>
        <Button variant="ghost" size="icon" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <select
            value={type}
            onChange={(e) => setType(e.target.value as WatchlistItem["type"])}
            className="h-10 rounded-md border border-white/20 bg-transparent px-3 text-sm"
          >
            {ENTITY_TYPES.map((t) => (
              <option key={t} value={t} className="bg-navy">
                {t}
              </option>
            ))}
          </select>
          <Input
            placeholder="address or slug"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              onAddItem(type, target);
              setTarget("");
            }}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {watchlist.items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No entities added yet.</p>
        ) : (
          <ul className="space-y-2">
            {watchlist.items.map((item) => (
              <li
                key={`${item.type}-${item.target}`}
                className="flex items-center justify-between p-2 rounded-lg border border-white/10 text-sm"
              >
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{item.type}</Badge>
                  <Link href={entityHref(item)} className="font-mono hover:text-gold transition-colors">
                    {item.target}
                  </Link>
                </div>
                <Button variant="ghost" size="icon" onClick={() => onRemoveItem(item)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
