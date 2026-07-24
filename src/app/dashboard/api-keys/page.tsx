import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ApiKeysManager } from "@/components/dashboard/api-keys-manager";

export default async function ApiKeysPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin?callbackUrl=/dashboard/api-keys");

  const keys = await prisma.apiKey.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      isActive: true,
      lastUsed: true,
      requests: true,
      createdAt: true,
    },
  });

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">API Keys</h1>
      <ApiKeysManager
        initialKeys={keys.map((k) => ({
          ...k,
          lastUsed: k.lastUsed?.toISOString() ?? null,
          createdAt: k.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
