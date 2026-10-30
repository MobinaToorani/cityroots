import "server-only";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import NextAuth, { type DefaultSession, type NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import { db } from "@/lib/db/client";
import { accounts, sessions, users, verificationTokens } from "@/lib/db/schema";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { sendMagicLink } from "./email";

export type Role = "user" | "curator" | "admin";

declare module "next-auth" {
  interface Session {
    user: { id: string; role: Role } & DefaultSession["user"];
  }
  interface User {
    role?: Role;
  }
}

function config(): NextAuthConfig {
  const e = env();
  const providers: NextAuthConfig["providers"] = [
    Resend({
      from: e.EMAIL_FROM,
      apiKey: e.RESEND_API_KEY,
      sendVerificationRequest: sendMagicLink,
    }),
  ];
  if (e.AUTH_GOOGLE_ID && e.AUTH_GOOGLE_SECRET) {
    providers.push(Google({ clientId: e.AUTH_GOOGLE_ID, clientSecret: e.AUTH_GOOGLE_SECRET }));
  }
  return {
    secret: e.AUTH_SECRET,
    trustHost: true,
    adapter: DrizzleAdapter(db(), {
      usersTable: users,
      accountsTable: accounts,
      sessionsTable: sessions,
      verificationTokensTable: verificationTokens,
    }),
    // Database sessions: the cookie holds an opaque, HTTP-only token and every
    // request reads the current role, so revoking access takes effect at once.
    session: { strategy: "database", maxAge: 60 * 60 * 24 * 30 },
    providers,
    pages: { signIn: "/signin", verifyRequest: "/signin/check-email", error: "/signin" },
    callbacks: {
      session({ session, user }) {
        session.user.id = user.id;
        session.user.role = user.role ?? "user";
        return session;
      },
    },
    logger: {
      error: (error) => logger.error("Auth error", { error }),
      warn: (code) => logger.warn("Auth warning", { code }),
    },
  };
}

export const { handlers, auth, signIn, signOut } = NextAuth(config);

export function googleSignInAvailable(): boolean {
  const e = env();
  return Boolean(e.AUTH_GOOGLE_ID && e.AUTH_GOOGLE_SECRET);
}
