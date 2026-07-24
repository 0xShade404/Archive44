"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Trash2 } from "lucide-react";

type Alert = {
  id: string;
  type: string;
  target: string;
  isActive: boolean;
  triggered: number;
  createdAt: string;
};

function entityHref(type: string, target: string): string {
  switch (type) {
    case "wallet":
      return `/wallet/${target}`;
    case "token":
      return `/token/${target}`;
    case "protocol":
      return `/protocol/${target}`;
    case "founder":
      return `/founder/${target}`;
    default:
      return "#";
  }
}

export function AlertsManager({ initialAlerts }: { initialAlerts: Alert[] }) {
  const [alerts, setAlerts] = useState(initialAlerts);

  async function handleToggle(id: string, isActive: boolean) {
    const res = await fetch(`/api/v1/alerts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive }),
    });
    if (!res.ok) {
      toast.error("Failed to update alert");
      return;
    }
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, isActive } : a)));
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/v1/alerts/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Failed to delete alert");
      return;
    }
    setAlerts((prev) => prev.filter((a) => a.id !== id));
    toast.success("Alert deleted");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Alerts</CardTitle>
        <CardDescription>Created from wallet, token, protocol, and founder pages</CardDescription>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No alerts yet. Create one from any entity page using the Alert button.
          </p>
        ) : (
          <ul className="space-y-3">
            {alerts.map((alert) => (
              <li
                key={alert.id}
                className="flex items-center justify-between p-3 rounded-lg border border-white/10"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{alert.type}</Badge>
                    <Link
                      href={entityHref(alert.type, alert.target)}
                      className="font-mono text-sm hover:text-gold transition-colors"
                    >
                      {alert.target}
                    </Link>
                    <Badge variant={alert.isActive ? "success" : "outline"}>
                      {alert.isActive ? "Active" : "Paused"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Triggered {alert.triggered} times
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggle(alert.id, !alert.isActive)}
                  >
                    {alert.isActive ? "Pause" : "Resume"}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(alert.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
