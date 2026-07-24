import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Search,
  Wallet,
  Coins,
  Bell,
  Key,
  CreditCard,
  Eye,
  Settings,
  ArrowRight,
} from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin?callbackUrl=/dashboard");

  const userId = session.user.id;
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [searchesThisMonth, savedWalletsCount, savedTokensCount, activeAlertsCount, recentSearches, subscription] =
    await Promise.all([
      prisma.search.count({ where: { userId, createdAt: { gte: startOfMonth } } }),
      prisma.savedWallet.count({ where: { userId } }),
      prisma.savedToken.count({ where: { userId } }),
      prisma.alert.count({ where: { userId, isActive: true } }),
      prisma.search.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.subscription.findUnique({ where: { userId } }),
    ]);

  const stats = [
    { label: "Searches this month", value: searchesThisMonth.toString(), icon: Search },
    { label: "Saved Wallets", value: savedWalletsCount.toString(), icon: Wallet },
    { label: "Saved Tokens", value: savedTokensCount.toString(), icon: Coins },
    { label: "Active Alerts", value: activeAlertsCount.toString(), icon: Bell },
  ];

  const plan = subscription?.plan ?? "FREE";

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {session.user.name || "there"}</p>
        </div>
        <div className="flex gap-2">
          <Badge variant={plan === "FREE" ? "outline" : "success"}>
            {plan.charAt(0) + plan.slice(1).toLowerCase()} Plan
          </Badge>
          {plan === "FREE" && (
            <Button size="sm" asChild>
              <Link href="/pricing">Upgrade to Pro</Link>
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold/10 text-gold">
                  <stat.icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Searches</CardTitle>
            <CardDescription>Your latest AI queries</CardDescription>
          </CardHeader>
          <CardContent>
            {recentSearches.length > 0 ? (
              <ul className="space-y-3">
                {recentSearches.map((s) => (
                  <li key={s.id}>
                    <Link
                      href={`/search?q=${encodeURIComponent(s.query)}`}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors group"
                    >
                      <span className="text-sm">{s.query}</span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-gold" />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                No searches yet.{" "}
                <Link href="/search" className="text-gold hover:underline">
                  Try the AI search
                </Link>
                .
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { href: "/search", label: "New AI Search", icon: Search },
              { href: "/dashboard/watchlists", label: "Watchlists", icon: Eye },
              { href: "/dashboard/alerts", label: "Alerts", icon: Bell },
              { href: "/dashboard/api-keys", label: "API Keys", icon: Key },
              { href: "/settings", label: "Billing", icon: CreditCard },
              { href: "/settings", label: "Settings", icon: Settings },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors text-sm"
              >
                <item.icon className="h-4 w-4 text-gold" />
                {item.label}
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
