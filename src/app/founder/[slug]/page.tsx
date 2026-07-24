import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EntityActions } from "@/components/entity-actions";
import { prisma } from "@/lib/prisma";
import { Users, Sparkles } from "lucide-react";

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
  const founder = await prisma.founder.findUnique({ where: { slug } });
  return { title: founder ? `${founder.name} — Founder Profile` : "Founder Profile" };
}

export default async function FounderProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const founder = await prisma.founder.findUnique({ where: { slug } });

  if (!founder) notFound();

  const risk = riskInfo(founder.riskScore);

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold/10 text-gold">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{founder.name}</h1>
              <p className="text-muted-foreground">Crypto Founder & Builder</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            <Badge variant={risk.variant}>Risk: {risk.label}</Badge>
          </div>
        </div>
        <EntityActions kind="founder" identifier={founder.slug} />
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
                {founder.aiSummary || founder.bio || "No summary available yet for this founder."}
              </p>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {founder.twitter && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Twitter</span>
                  <span>@{founder.twitter}</span>
                </div>
              )}
              {founder.linkedin && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">LinkedIn</span>
                  <a href={founder.linkedin} target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">
                    Visit
                  </a>
                </div>
              )}
              {!founder.twitter && !founder.linkedin && (
                <p className="text-muted-foreground">No social links available.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
