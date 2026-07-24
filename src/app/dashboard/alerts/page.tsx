import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AlertsManager } from "@/components/dashboard/alerts-manager";

export default async function AlertsPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin?callbackUrl=/dashboard/alerts");

  const alerts = await prisma.alert.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Alerts</h1>
      <AlertsManager
        initialAlerts={alerts.map((a) => ({
          id: a.id,
          type: a.type,
          target: a.target,
          isActive: a.isActive,
          triggered: a.triggered,
          createdAt: a.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
