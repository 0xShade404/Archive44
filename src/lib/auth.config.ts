import type { NextAuthConfig } from "next-auth";

const PROTECTED_PATHS = ["/dashboard", "/settings"];

/**
 * Edge-safe auth config (no Prisma adapter, no bcrypt-based Credentials
 * provider) — consumed by middleware, which runs on the Edge runtime.
 */
export const authConfig: NextAuthConfig = {
  trustHost: true,
  pages: {
    signIn: "/auth/signin",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isProtected = PROTECTED_PATHS.some(
        (p) => nextUrl.pathname === p || nextUrl.pathname.startsWith(`${p}/`)
      );
      return !isProtected || !!auth?.user;
    },
  },
};
