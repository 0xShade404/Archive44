import NextAuth, { type NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { verifyMessage } from "viem";
import { prisma } from "@/lib/prisma";
import { consumeNonce, buildSignMessage } from "@/lib/wallet-nonce";
import { authConfig } from "@/lib/auth.config";

const providers: NextAuthConfig["providers"] = [
  CredentialsProvider({
    name: "Credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) return null;

      const user = await prisma.user.findUnique({
        where: { email: (credentials.email as string).toLowerCase() },
      });

      if (!user || !user.password) return null;

      const valid = await bcrypt.compare(credentials.password as string, user.password);
      if (!valid) return null;

      return { id: user.id, name: user.name, email: user.email, role: user.role };
    },
  }),
  CredentialsProvider({
    id: "wallet",
    name: "Wallet",
    credentials: {
      address: { label: "Address", type: "text" },
      signature: { label: "Signature", type: "text" },
    },
    async authorize(credentials) {
      if (!credentials?.address || !credentials?.signature) return null;

      const address = credentials.address as `0x${string}`;
      const nonce = await consumeNonce(address);
      if (!nonce) return null;

      const message = buildSignMessage(address, nonce);
      const valid = await verifyMessage({
        address,
        message,
        signature: credentials.signature as `0x${string}`,
      }).catch(() => false);

      if (!valid) return null;

      const user = await prisma.user.upsert({
        where: { walletAddress: address.toLowerCase() },
        update: {},
        create: {
          walletAddress: address.toLowerCase(),
          name: `${address.slice(0, 6)}...${address.slice(-4)}`,
          subscription: { create: { plan: "FREE", status: "ACTIVE" } },
        },
      });

      return { id: user.id, name: user.name, email: user.email, role: user.role };
    },
  }),
];

if (process.env.GITHUB_ID && process.env.GITHUB_SECRET) {
  providers.push(
    GitHubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    })
  );
}

if (process.env.GOOGLE_ID && process.env.GOOGLE_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET,
    })
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers,
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role ?? "USER";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as string) ?? "USER";
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
});
