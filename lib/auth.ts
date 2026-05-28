import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import { db } from "./db";
import bcrypt from "bcryptjs";
import type { Role } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: Role;
      provider?: string;
    };
  }
  interface User {
    role: Role;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await db.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user?.passwordHash) return null;

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
    ...(process.env.AUTH_MICROSOFT_ENTRA_ID_ID
      ? [
          MicrosoftEntraID({
            clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID!,
            clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET!,
            issuer: `https://login.microsoftonline.com/${process.env.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID}/v2.0`,
            authorization: { params: { prompt: "select_account" } },
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, user, trigger, account }) {
      if (account) {
        token.provider = account.provider;
      }
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      if (trigger === "update" && token.id) {
        const fresh = await db.user.findUnique({
          where: { id: token.id as string },
          select: { name: true, role: true },
        });
        if (fresh) {
          token.name = fresh.name;
          token.role = fresh.role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.name = token.name as string;
        session.user.provider = token.provider as string | undefined;
      }
      return session;
    },
    async signIn({ user, account }) {
      if (account?.provider === "microsoft-entra-id") {
        const existing = await db.user.findFirst({
          where: {
            OR: [
              { azureId: account.providerAccountId },
              { email: user.email! },
            ],
          },
        });

        if (!existing) {
          await db.user.create({
            data: {
              email: user.email!,
              name: user.name ?? user.email!,
              azureId: account.providerAccountId,
              role: "EMPLOYEE",
            },
          });
        } else if (!existing.azureId) {
          await db.user.update({
            where: { id: existing.id },
            data: { azureId: account.providerAccountId },
          });
        }

        const dbUser = await db.user.findUnique({
          where: { email: user.email! },
        });
        if (dbUser) {
          user.id = dbUser.id;
          (user as typeof user & { role: Role }).role = dbUser.role;
        }
      }
      return true;
    },
  },
});
