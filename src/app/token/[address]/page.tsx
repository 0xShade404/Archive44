import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EntityActions } from "@/components/entity-actions";
import { prisma } from "@/lib/prisma";
import { formatAddress, formatNumber, formatUSD } from "@/lib/utils";
import { Coins, Sparkles, TrendingUp } from "lucide-react";

async function getToken(address: string) {
  return prisma.token.findFirst({
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
  const token = await getToken(address);
  return { title: token ? `${token.symbol} — Token Profile` : "Token Profile" };
}

export default async function TokenProfilePage({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  const { address } = await params;
  const token = await getToken(address);

  if (!token) notFound();

  const risk = riskInfo(token.riskScore);

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold/10 text-gold">
              <Coins className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{token.symbol}</h1>
              <p className="text-muted-foreground">
                {token.name} · {formatAddress(token.address)}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            <Badge variant={risk.variant}>Risk: {risk.label}</Badge>
          </div>
        </div>
        <EntityActions kind="token" identifier={token.address} chain={token.chain} />
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
                {token.aiSummary || "No AI summary has been generated for this token yet."}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-gold" />
                <CardTitle>Token Metrics</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: "Price", value: token.priceUsd != null ? formatUSD(token.priceUsd) : "—" },
                  {
                    label: "Market Cap",
                    value: token.marketCap != null ? `$${formatNumber(token.marketCap)}` : "—",
                  },
                  { label: "Holders", value: token.holders != null ? formatNumber(token.holders, 0) : "—" },
                  { label: "Total Supply", value: token.totalSupply || "—" },
                ].map((m) => (
                  <div key={m.label} className="text-center p-3 rounded-lg bg-white/5">
                    <p className="text-xs text-muted-foreground">{m.label}</p>
                    <p className="text-lg font-semibold mt-1">{m.value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contract Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Chain</span>
                <span className="capitalize">{token.chain}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Decimals</span>
                <span>{token.decimals}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Launch</span>
                <span>{token.launchDate ? new Date(token.launchDate).toLocaleDateString() : "Unknown"}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
