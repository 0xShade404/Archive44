import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "About",
  description: "Learn about Archive44 — the memory layer of crypto.",
};

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-3xl">
      <Badge className="mb-4" variant="outline">About Archive44</Badge>
      <h1 className="text-4xl font-bold mb-6">
        The Memory Layer of <span className="gradient-text">Crypto</span>
      </h1>
      <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground leading-relaxed">
        <p className="text-lg">
          Archive44 is an AI-powered crypto intelligence platform that permanently archives and organizes
          wallets, tokens, founders, DAOs, governance, contracts, social history, and blockchain activity
          into one searchable knowledge base.
        </p>
        <p>
          In a space where information is fragmented across explorers, social media, governance forums,
          and countless dashboards, Archive44 creates a unified, AI-native memory layer. We believe that
          the history of crypto should be permanent, searchable, and intelligent.
        </p>
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-xl font-semibold text-white mb-3">Our Mission</h2>
            <p>
              To build the definitive intelligence layer for crypto — combining permanent archival of
              on-chain and off-chain data with advanced AI that makes that history accessible,
              understandable, and actionable for researchers, investors, builders, and the broader community.
            </p>
          </CardContent>
        </Card>
        <h2 className="text-2xl font-semibold text-white pt-4">What Makes Us Different</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Crypto-native payments — ETH & USDT only, no credit cards</li>
          <li>AI-first search across the entire knowledge graph</li>
          <li>Permanent archival mindset — history should never be lost</li>
          <li>Beautiful, premium UX inspired by the best modern tools</li>
          <li>Built for both humans and machines via a powerful API</li>
        </ul>
      </div>
    </div>
  );
}
