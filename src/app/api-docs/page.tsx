"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const endpoints = [
  { method: "GET", path: "/api/v1/search", desc: "AI-powered search across all entities" },
  { method: "GET", path: "/api/v1/wallets/:address", desc: "Get wallet profile and AI summary" },
  { method: "GET", path: "/api/v1/tokens/:address", desc: "Get token profile and metrics" },
  { method: "GET", path: "/api/v1/protocols/:slug", desc: "Get protocol profile" },
  { method: "GET", path: "/api/v1/founders/:slug", desc: "Get founder profile" },
  { method: "POST", path: "/api/v1/alerts", desc: "Create a new alert" },
  { method: "GET", path: "/api/v1/watchlists", desc: "List user watchlists" },
];

export default function ApiDocsPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-3xl mx-auto">
        <Badge className="mb-4" variant="outline">Developer API</Badge>
        <h1 className="text-4xl font-bold mb-4">
          Archive44 <span className="gradient-text">API</span>
        </h1>
        <p className="text-muted-foreground mb-8 text-lg">
          Full REST API access to the Archive44 knowledge base. Available on Pro and Enterprise plans.
        </p>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Authentication</CardTitle>
            <CardDescription>All API requests require an API key</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-navy-800 rounded-lg p-4 text-sm overflow-x-auto">
{`curl -H "Authorization: Bearer YOUR_API_KEY" \\
  https://api.archive44.com/v1/search?q=uniswap`}
            </pre>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Rate Limits</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span>Pro</span><span>1,000 requests/day</span></div>
            <div className="flex justify-between"><span>Enterprise</span><span>Custom / Unlimited</span></div>
          </CardContent>
        </Card>

        <h2 className="text-2xl font-semibold mb-4">Endpoints</h2>
        <div className="space-y-3 mb-10">
          {endpoints.map((ep) => (
            <Card key={ep.path}>
              <CardContent className="p-4 flex items-center gap-4">
                <Badge variant={ep.method === "GET" ? "success" : "warning"} className="w-16 justify-center">
                  {ep.method}
                </Badge>
                <div>
                  <code className="text-sm font-mono text-gold">{ep.path}</code>
                  <p className="text-xs text-muted-foreground mt-0.5">{ep.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-gold/20">
          <CardContent className="py-8 text-center">
            <h3 className="text-xl font-semibold mb-2">Ready to build?</h3>
            <p className="text-muted-foreground mb-4">Upgrade to Pro to get your API key.</p>
            <Button asChild>
              <Link href="/pricing">View Pricing</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
