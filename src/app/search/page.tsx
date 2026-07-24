"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Search, Sparkles, Wallet, Coins, Users, FileText, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

type SearchResult = {
  type: "wallet" | "token" | "protocol" | "founder";
  title: string;
  subtitle: string;
  summary: string;
  risk: "Low" | "Medium" | "High";
  href: string;
};

const typeIcons: Record<string, React.ReactNode> = {
  wallet: <Wallet className="h-4 w-4" />,
  token: <Coins className="h-4 w-4" />,
  protocol: <FileText className="h-4 w-4" />,
  founder: <Users className="h-4 w-4" />,
};

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [aiSummary, setAiSummary] = useState("");
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery);
    }
  }, [initialQuery]);

  const performSearch = async (q: string) => {
    if (!q.trim()) return;
    setIsSearching(true);
    setResults([]);
    setAiSummary("");
    setError("");
    setHasSearched(true);

    try {
      const res = await fetch(`/api/v1/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Search failed. Please try again.");
        return;
      }

      setAiSummary(data.summary);
      setResults(data.results);
    } catch {
      setError("Search failed. Please check your connection and try again.");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto mb-12">
        <h1 className="text-3xl font-bold mb-2 text-center">
          AI <span className="gradient-text">Search</span>
        </h1>
        <p className="text-muted-foreground text-center mb-8">
          Ask anything about wallets, tokens, protocols, founders, or on-chain events.
        </p>

        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-gold/20 via-transparent to-gold/20 rounded-2xl blur opacity-50 group-hover:opacity-75 transition" />
          <div className="relative flex items-center gap-2 glass-strong rounded-xl p-2">
            <Search className="h-5 w-5 text-muted-foreground ml-3 shrink-0" />
            <Input
              placeholder="e.g. Show wallets interacting with Uniswap..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && performSearch(query)}
              className="border-0 bg-transparent focus-visible:ring-0 text-base h-12"
            />
            <Button
              size="lg"
              className="shrink-0"
              onClick={() => performSearch(query)}
              disabled={isSearching}
            >
              {isSearching ? (
                <span className="animate-pulse">Searching...</span>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Search
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {isSearching && (
        <div className="max-w-3xl mx-auto space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-white/10 rounded w-1/3 mb-3" />
                <div className="h-3 bg-white/5 rounded w-full mb-2" />
                <div className="h-3 bg-white/5 rounded w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {error && !isSearching && (
        <div className="max-w-3xl mx-auto">
          <Card className="border-destructive/30">
            <CardContent className="p-6 text-sm text-destructive">{error}</CardContent>
          </Card>
        </div>
      )}

      {aiSummary && !isSearching && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto mb-8"
        >
          <Card className="border-gold/20">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-gold" />
                <CardTitle className="text-lg">AI Summary</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">{aiSummary}</p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {results.length > 0 && !isSearching && (
        <div className="max-w-3xl mx-auto space-y-4">
          <h2 className="text-lg font-semibold mb-4">Results</h2>
          {results.map((result, i) => (
            <motion.div
              key={result.href}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Link href={result.href}>
                <Card className="hover:border-gold/30 transition-all cursor-pointer group">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="gap-1">
                            {typeIcons[result.type]}
                            {result.type}
                          </Badge>
                          <Badge
                            variant={result.risk === "Low" ? "success" : "warning"}
                          >
                            Risk: {result.risk}
                          </Badge>
                        </div>
                        <h3 className="font-semibold text-lg group-hover:text-gold transition-colors">
                          {result.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-2">{result.subtitle}</p>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {result.summary}
                        </p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-gold transition-colors shrink-0 mt-1" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      {hasSearched && !isSearching && !error && results.length === 0 && (
        <div className="max-w-3xl mx-auto text-center text-muted-foreground text-sm">
          No results found. Try a wallet address, token symbol, protocol, or founder name.
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-12 text-center">Loading...</div>}>
      <SearchContent />
    </Suspense>
  );
}
