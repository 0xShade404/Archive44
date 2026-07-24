import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { WatchlistsManager } from "@/components/dashboard/watchlists-manager";

export default async function WatchlistsPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin?callbackUrl=/dashboard/watchlists");

  const watchlists = await prisma.watchlist.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Watchlists</h1>
      <WatchlistsManager
        initialWatchlists={watchlists.map((w) => ({
          id: w.id,
          name: w.name,
          items: (w.items ?? []) as { type: "wallet" | "token" | "protocol" | "founder"; target: string }[],
          createdAt: w.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
