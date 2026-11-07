import type { DefaultSession } from "next-auth";

// Extend the built-in Auth.js session/user/JWT types with our own
// id and role fields so they are available with full typing everywhere
// `auth()` or `useSession()` is called.
declare module "next-auth" {
  interface Session {
    authVersion?: string;
    user: {
      id: string;
      role: "FARMER" | "EXPERT" | "ADMIN" | "OWNER" | "WORKER";
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: "FARMER" | "EXPERT" | "ADMIN" | "OWNER" | "WORKER";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    authVersion?: string;
    id: string;
    role: "FARMER" | "EXPERT" | "ADMIN" | "OWNER" | "WORKER";
  }
}
