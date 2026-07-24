import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EntityActions } from "@/components/entity-actions";
import { prisma } from "@/lib/prisma";
import { formatAddress, formatNumber } from "@/lib/utils";
import { Wallet, Shield, Clock, Sparkles } from "lucide-react";

async function getWallet(address: string) {
  return prisma.wallet.findFirst({
    where: { address: { equals: address, mode: "insensitive" } },
  });
}

function riskInfo(score: number): { variant: "success" | "warning" | "destructive"; label: string } {
  if (score < 34) return { variant: "success", label: "Low" };
  if (score < 67) return { variant: "warning", label: "Medium" };
  return { variant: "destructive", label: "High" };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ address: string }>;
}): Promise<Metadata> {
  const { address } = await params;
  const wallet = await getWallet(address);
  const title = wallet?.ens || wallet?.label || formatAddress(address, 6);
  return { title: `${title} — Wallet Profile` };
}

export default async function WalletProfilePage({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  const { address } = await params;
  const wallet = await getWallet(address);

  if (!wallet) notFound();

  const timeline = Array.isArray((wallet.metadata as { timeline?: unknown[] } | null)?.timeline)
    ? ((wallet.metadata as { timeline: { date: string; event: string }[] }).timeline)
    : [];

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold/10 text-gold">
              <Wallet className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-mono">{formatAddress(wallet.address, 6)}</h1>
              <p className="text-muted-foreground">{wallet.ens || wallet.label || "Unlabeled wallet"}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            <Badge variant={riskInfo(wallet.riskScore).variant}>
              Risk: {riskInfo(wallet.riskScore).label} ({Math.round(wallet.riskScore)}/100)
            </Badge>
            {wallet.tags.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
        <EntityActions kind="wallet" identifier={wallet.address} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-gold/20">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-gold" />
                <CardTitle>AI Summary</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                {wallet.aiSummary || "No AI summary has been generated for this wallet yet."}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-gold" />
                <CardTitle>Timeline</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {timeline.length > 0 ? (
                <div className="space-y-4">
                  {timeline.map((item, i) => (
                    <div key={`${item.date}-${i}`} className="flex gap-4 items-start">
                      <div className="text-sm text-muted-foreground font-mono w-20 shrink-0">
                        {item.date}
                      </div>
                      <div className="h-2 w-2 rounded-full bg-gold mt-1.5 shrink-0" />
                      <p className="text-sm">{item.event}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No timeline data available yet.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Balance</span>
                <span className="font-medium">~{formatNumber(wallet.balanceEth)} ETH</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Transactions</span>
                <span className="font-medium">{wallet.txCount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">First Seen</span>
                <span className="font-medium">
                  {wallet.firstSeen ? new Date(wallet.firstSeen).toLocaleDateString() : "Unknown"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Active</span>
                <span className="font-medium">
                  {wallet.lastActive ? new Date(wallet.lastActive).toLocaleDateString() : "Unknown"}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-gold" />
                <CardTitle className="text-lg">Risk Analysis</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-4">
                <div className="text-4xl font-bold text-emerald-400">{Math.round(wallet.riskScore)}</div>
                <CardDescription>Risk Score</CardDescription>
              </div>
              <p className="text-xs text-muted-foreground">
                Based on activity patterns, counterparty analysis, and known entity associations.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
