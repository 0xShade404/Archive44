"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowRight } from "lucide-react";
import { CryptoCheckoutButton } from "@/components/pricing/crypto-checkout-button";

const plans = [
  {
    id: "free",
    name: "Free",
    price: 0,
    period: "forever",
    description: "Perfect for exploring the platform",
    features: [
      "Basic AI search (10/day)",
      "Public entity profiles",
      "Limited timeline views",
      "Community support",
    ],
    cta: "Get Started",
    href: "/auth/signup",
  },
  {
    id: "pro",
    name: "Pro",
    price: 49,
    period: "month",
    description: "For serious researchers and investors",
    features: [
      "Unlimited AI search",
      "Full wallet reports",
      "Real-time alerts",
      "Watchlists (unlimited)",
      "CSV/JSON exports",
      "REST API access (1k req/day)",
      "Priority support",
    ],
    cta: "Subscribe with Crypto",
    href: "/dashboard/billing",
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: null,
    period: "custom",
    description: "For teams and organizations",
    features: [
      "Everything in Pro",
      "Team seats & SSO",
      "Unlimited API access",
      "Dedicated account manager",
      "Higher rate limits",
      "Custom integrations",
      "SLA & audit logs",
      "On-premise options",
    ],
    cta: "Contact Sales",
    href: "/contact",
  },
];

export default function PricingPage() {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center mb-16">
        <Badge className="mb-4" variant="outline">
          Crypto-Native Payments
        </Badge>
        <h1 className="text-4xl sm:text-5xl font-bold mb-4">
          Simple, transparent <span className="gradient-text">pricing</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
          Pay with ETH or USDT. Connect your wallet. No credit cards. No intermediaries.
        </p>

        <div className="inline-flex items-center gap-1 p-1 rounded-lg border border-white/10 bg-white/5">
          <button
            onClick={() => setBilling("monthly")}
            className={`px-4 py-2 rounded-md text-sm transition-all ${
              billing === "monthly" ? "bg-gold text-navy font-medium" : "text-muted-foreground"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBilling("yearly")}
            className={`px-4 py-2 rounded-md text-sm transition-all ${
              billing === "yearly" ? "bg-gold text-navy font-medium" : "text-muted-foreground"
            }`}
          >
            Yearly <span className="text-xs opacity-75">Save 20%</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16">
        {plans.map((plan, i) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card
              className={`h-full relative ${
                plan.popular ? "border-gold/50 shadow-xl shadow-gold/10" : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge>Most Popular</Badge>
                </div>
              )}
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-6">
                  {plan.price !== null ? (
                    <>
                      <span className="text-5xl font-bold">
                        ${billing === "yearly" && plan.price > 0
                          ? Math.round(plan.price * 0.8)
                          : plan.price}
                      </span>
                      {plan.price > 0 && (
                        <span className="text-muted-foreground">/{plan.period}</span>
                      )}
                    </>
                  ) : (
                    <span className="text-4xl font-bold">Custom</span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex flex-col h-full">
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-gold shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                {plan.id === "pro" ? (
                  <CryptoCheckoutButton />
                ) : (
                  <Button
                    className="w-full"
                    variant={plan.popular ? "default" : "outline"}
                    size="lg"
                    asChild
                  >
                    <Link href={plan.href}>
                      {plan.cta}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Payment methods */}
      <div className="text-center max-w-2xl mx-auto">
        <h3 className="text-lg font-semibold mb-4">Accepted Payment Methods</h3>
        <div className="flex flex-wrap justify-center gap-4">
          {["Ethereum (ETH)", "USDT (ERC-20)", "MetaMask", "WalletConnect", "Coinbase Wallet", "Rabby"].map(
            (method) => (
              <Badge key={method} variant="outline" className="px-4 py-2">
                {method}
              </Badge>
            )
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-6">
          Coming soon: Base, Arbitrum, Optimism, Solana, BNB Chain
        </p>
      </div>
    </div>
  );
}
