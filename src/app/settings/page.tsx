import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProfileForm } from "@/components/settings/profile-form";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin?callbackUrl=/settings");

  const [user, subscription] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id } }),
    prisma.subscription.findUnique({ where: { userId: session.user.id } }),
  ]);

  const plan = subscription?.plan ?? "FREE";

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Manage your account information</CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileForm initialName={user?.name || ""} email={user?.email || "No email (wallet account)"} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subscription</CardTitle>
            <CardDescription>Your current plan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <Badge variant={plan === "FREE" ? "outline" : "success"}>
                  {plan.charAt(0) + plan.slice(1).toLowerCase()} Plan
                </Badge>
                <p className="text-sm text-muted-foreground mt-2">
                  Upgrade for unlimited AI and API access.
                </p>
              </div>
              <Button variant="outline" asChild>
                <Link href="/pricing">Upgrade</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Security</CardTitle>
            <CardDescription>Password and connected wallets</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" asChild>
              <Link href="/auth/forgot-password">Change Password</Link>
            </Button>
            {user?.walletAddress && (
              <p className="text-sm text-muted-foreground">
                Connected wallet: <span className="font-mono">{user.walletAddress}</span>
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
