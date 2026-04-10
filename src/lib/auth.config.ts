import type { NextAuthConfig } from "next-auth";

/**
 * Edge-compatible auth config (no Node.js-only imports like bcrypt or Prisma).
 * Used by middleware. The full auth config in auth.ts extends this.
 */
export const authConfig = {
  pages: {
    signIn: "/connexion",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.clientId = (user as any).clientId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        (session.user as any).role = token.role;
        (session.user as any).clientId = token.clientId;
      }
      return session;
    },
  },
  providers: [], // Providers added in auth.ts (they need Node.js APIs)
} satisfies NextAuthConfig;
