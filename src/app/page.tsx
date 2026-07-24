"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Wallet,
  Coins,
  Users,
  Shield,
  Clock,
  Network,
  Sparkles,
  Bell,
  Code,
  ArrowRight,
  ChevronRight,
  Zap,
  FileText,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";

const features = [
  {
    icon: Search,
    title: "AI Search",
    description: "Natural language queries across wallets, tokens, protocols, and on-chain history.",
  },
  {
    icon: Wallet,
    title: "Wallet Intelligence",
    description: "Deep profiles with risk scores, activity timelines, and related entities.",
  },
  {
    icon: Coins,
    title: "Token Analytics",
    description: "Tokenomics history, holder analysis, and smart contract insights.",
  },
  {
    icon: Users,
    title: "Founder Profiles",
    description: "Track founders, their projects, funding history, and social presence.",
  },
  {
    icon: Shield,
    title: "Risk Detection",
    description: "AI-powered risk scoring for wallets, tokens, and protocols.",
  },
  {
    icon: Clock,
    title: "Smart Timelines",
    description: "Interactive timelines of key events from launch to present.",
  },
  {
    icon: Network,
    title: "Related Entities",
    description: "Discover connected wallets, tokens, and protocols automatically.",
  },
  {
    icon: Sparkles,
    title: "AI Summaries",
    description: "Instant intelligent summaries of any on-chain entity or event.",
  },
  {
    icon: Bell,
    title: "Alerts & Watchlists",
    description: "Real-time notifications for wallets, tokens, and governance events.",
  },
  {
    icon: Code,
    title: "API Access",
    description: "Full REST API for builders to integrate Archive44 intelligence.",
  },
  {
    icon: FileText,
    title: "Archived Social",
    description: "Preserved social history linked to on-chain identities.",
  },
  {
    icon: TrendingUp,
    title: "Governance History",
    description: "Complete DAO proposal and voting records with AI context.",
  },
];

const timelineEvents = [
  { label: "Wallet Created", date: "2021-03" },
  { label: "Token Launch", date: "2021-06" },
  { label: "Seed Funding", date: "2021-09" },
  { label: "Governance Vote", date: "2022-01" },
  { label: "Exchange Listing", date: "2022-04" },
  { label: "Major Event", date: "2023-08" },
  { label: "Current Status", date: "Now" },
];

const exampleSearches = [
  "Show wallets interacting with this protocol",
  "Summarize this token",
  "Explain governance history of Uniswap",
  "Find wallets linked to this founder",
  "Show previous tokenomics changes",
];

const testimonials = [
  {
    name: "Alex Chen",
    role: "Crypto Analyst",
    content:
      "Archive44 has completely transformed how I research on-chain activity. The AI summaries save me hours every day.",
    avatar: "AC",
  },
  {
    name: "Sarah Kim",
    role: "DeFi Researcher",
    content:
      "The wallet intelligence and risk detection features are unmatched. Essential tool for any serious crypto professional.",
    avatar: "SK",
  },
  {
    name: "Marcus Webb",
    role: "DAO Contributor",
    content:
      "Finally a platform that properly archives governance history. The timeline views are incredibly powerful.",
    avatar: "MW",
  },
];

const faqs = [
  {
    q: "What is Archive44?",
    a: "Archive44 is an AI-powered crypto intelligence platform that permanently archives and organizes wallets, tokens, founders, DAOs, governance, contracts, social history, and blockchain activity into one searchable knowledge base.",
  },
  {
    q: "How does the AI search work?",
    a: "Our AI understands natural language queries and searches across our comprehensive knowledge base of on-chain and off-chain data to deliver precise, contextual answers with citations.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We are crypto-native. We accept Ethereum (ETH) and USDT (ERC-20) via MetaMask, WalletConnect, Coinbase Wallet, and Rabby. No traditional credit cards required.",
  },
  {
    q: "Is there a free plan?",
    a: "Yes! Our Free plan includes basic search, limited AI queries, and access to public profiles. Upgrade to Pro for unlimited AI and advanced features.",
  },
  {
    q: "Do you offer an API?",
    a: "Yes. Pro and Enterprise plans include full REST API access with authentication, rate limits based on plan, and comprehensive documentation.",
  },
];

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-navy-100/20 via-transparent to-transparent" />
      </div>

      {/* Hero */}
      <section className="relative container mx-auto px-4 pt-20 pb-32 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Badge className="mb-6" variant="outline">
            <Zap className="h-3 w-3 mr-1" />
            The Memory Layer of Crypto
          </Badge>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight mb-6">
            The Memory Layer
            <br />
            <span className="gradient-text">of Crypto.</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Search every wallet, token, founder, protocol, DAO and on-chain event with AI.
          </p>

          {/* Search bar */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-gold/30 via-gold/10 to-gold/30 rounded-2xl blur opacity-50 group-hover:opacity-75 transition duration-500" />
              <div className="relative flex items-center gap-2 glass-strong rounded-xl p-2">
                <Search className="h-5 w-5 text-muted-foreground ml-3 shrink-0" />
                <Input
                  placeholder="Ask anything about crypto..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="border-0 bg-transparent focus-visible:ring-0 text-base h-12"
                />
                <Button size="lg" className="shrink-0" asChild>
                  <Link href={`/search?q=${encodeURIComponent(searchQuery)}`}>
                    Search
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-3 mb-12">
            <Button size="lg" asChild>
              <Link href="/search">
                Start Searching
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/demo">View Demo</Link>
            </Button>
          </div>

          {/* Example searches */}
          <div className="flex flex-wrap justify-center gap-2 max-w-3xl mx-auto">
            {exampleSearches.map((q) => (
              <button
                key={q}
                onClick={() => setSearchQuery(q)}
                className="text-xs px-3 py-1.5 rounded-full border border-white/10 text-muted-foreground hover:text-white hover:border-gold/30 transition-all"
              >
                {q}
              </button>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Everything you need to <span className="gradient-text">understand crypto</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Premium intelligence tools designed for researchers, investors, and builders.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              viewport={{ once: true }}
            >
              <Card className="h-full hover:border-gold/30 transition-all duration-300 group">
                <CardHeader>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10 text-gold mb-3 group-hover:bg-gold/20 transition-colors">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Timeline Preview */}
      <section className="container mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Smart <span className="gradient-text">Timelines</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Visualize the complete history of any entity from creation to current status.
          </p>
        </div>
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-gold via-gold/50 to-transparent md:left-1/2" />
            {timelineEvents.map((event, i) => (
              <motion.div
                key={event.label}
                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className={`relative flex items-center gap-4 mb-8 ${
                  i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                }`}
              >
                <div className={`flex-1 ${i % 2 === 0 ? "md:text-right" : "md:text-left"}`}>
                  <Card className="inline-block">
                    <CardContent className="p-4">
                      <p className="font-medium">{event.label}</p>
                      <p className="text-sm text-muted-foreground">{event.date}</p>
                    </CardContent>
                  </Card>
                </div>
                <div className="absolute left-4 md:left-1/2 -translate-x-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-navy border-2 border-gold z-10">
                  <div className="h-2 w-2 rounded-full bg-gold" />
                </div>
                <div className="flex-1 hidden md:block" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="container mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Simple, crypto-native <span className="gradient-text">pricing</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Pay with ETH or USDT. No credit cards. No middlemen.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {[
            {
              name: "Free",
              price: "$0",
              desc: "For explorers",
              features: ["Basic search", "Limited AI queries", "Public profiles"],
            },
            {
              name: "Pro",
              price: "$49",
              desc: "per month",
              features: [
                "Unlimited AI",
                "Wallet reports",
                "Alerts & Watchlists",
                "Exports",
                "API Access",
              ],
              popular: true,
            },
            {
              name: "Enterprise",
              price: "Custom",
              desc: "for teams",
              features: [
                "Teams & SSO",
                "Unlimited API",
                "Dedicated support",
                "Higher limits",
                "Custom integrations",
              ],
            },
          ].map((plan) => (
            <Card
              key={plan.name}
              className={`relative ${plan.popular ? "border-gold/50 shadow-lg shadow-gold/10" : ""}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge>Most Popular</Badge>
                </div>
              )}
              <CardHeader className="text-center">
                <CardTitle>{plan.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.price !== "Custom" && (
                    <span className="text-muted-foreground">/mo</span>
                  )}
                </div>
                <CardDescription>{plan.desc}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <ChevronRight className="h-4 w-4 text-gold shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  variant={plan.popular ? "default" : "outline"}
                  asChild
                >
                  <Link href="/pricing">
                    {plan.name === "Enterprise" ? "Contact Sales" : "Get Started"}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="container mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Trusted by <span className="gradient-text">crypto professionals</span>
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {testimonials.map((t) => (
            <Card key={t.name}>
              <CardContent className="pt-6">
                <p className="text-muted-foreground mb-6 leading-relaxed">&ldquo;{t.content}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/20 text-gold font-semibold text-sm">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="container mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Frequently asked <span className="gradient-text">questions</span>
          </h2>
        </div>
        <div className="max-w-2xl mx-auto space-y-3">
          {faqs.map((faq, i) => (
            <Card key={i} className="overflow-hidden">
              <button
                className="w-full text-left p-5 flex items-center justify-between gap-4 hover:bg-white/5 transition-colors"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <span className="font-medium">{faq.q}</span>
                <ChevronRight
                  className={`h-4 w-4 shrink-0 transition-transform ${
                    openFaq === i ? "rotate-90" : ""
                  }`}
                />
              </button>
              {openFaq === i && (
                <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">
                  {faq.a}
                </div>
              )}
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-24">
        <Card className="relative overflow-hidden border-gold/20">
          <div className="absolute inset-0 bg-gradient-to-r from-gold/10 via-transparent to-gold/5" />
          <CardContent className="relative py-16 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Start archiving crypto history today
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto mb-8">
              Join researchers, investors, and builders who rely on Archive44 for on-chain intelligence.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button size="lg" asChild>
                <Link href="/auth/signup">
                  Get Started Free
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/contact">Talk to Sales</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
