import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EntityActions } from "@/components/entity-actions";
import { prisma } from "@/lib/prisma";
import { formatNumber } from "@/lib/utils";
import { FileText, Sparkles } from "lucide-react";

function riskInfo(score: number): { variant: "success" | "warning" | "destructive"; label: string } {
  if (score < 34) return { variant: "success", label: "Low" };
  if (score < 67) return { variant: "warning", label: "Medium" };
  return { variant: "destructive", label: "High" };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const protocol = await prisma.protocol.findUnique({ where: { slug } });
  return { title: protocol ? `${protocol.name} — Protocol Profile` : "Protocol Profile" };
}

export default async function ProtocolProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const protocol = await prisma.protocol.findUnique({ where: { slug } });

  if (!protocol) notFound();

  const risk = riskInfo(protocol.riskScore);

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold/10 text-gold">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{protocol.name}</h1>
              <p className="text-muted-foreground">{protocol.category || "Protocol"}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            <Badge variant={risk.variant}>Risk: {risk.label}</Badge>
            {protocol.category && <Badge variant="outline">{protocol.category}</Badge>}
          </div>
        </div>
        <EntityActions kind="protocol" identifier={protocol.slug} />
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
                {protocol.aiSummary || protocol.description || "No summary available yet for this protocol."}
              </p>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">TVL</span>
                <span>{protocol.tvl != null ? `$${formatNumber(protocol.tvl)}` : "—"}</span>
              </div>
              {protocol.website && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Website</span>
                  <a href={protocol.website} target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">
                    Visit
                  </a>
                </div>
              )}
              {protocol.twitter && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Twitter</span>
                  <span>@{protocol.twitter}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
