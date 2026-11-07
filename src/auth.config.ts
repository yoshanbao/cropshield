import type { NextAuthConfig } from "next-auth";

/** Shared Auth.js pages and JWT callbacks. Credential and database checks live
 * in auth.ts; server-page authorization rechecks the account in pageAccess.ts. */
export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.authVersion = "email-password-v1";
        token.id = user.id;
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      session.authVersion = token.authVersion as string | undefined;
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "FARMER" | "EXPERT" | "ADMIN" | "OWNER" | "WORKER";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
