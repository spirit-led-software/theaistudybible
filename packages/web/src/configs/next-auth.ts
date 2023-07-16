import { db } from "@chatesv/core/database";
import { users } from "@chatesv/core/database/schema";
import { config as coreConfig } from "@core/configs/auth";
import { addRoleToUser } from "@core/services/role";
import { eq } from "drizzle-orm";
import { NextAuthOptions } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import FacebookProvider from "next-auth/providers/facebook";
import GoogleProvider from "next-auth/providers/google";

export const config: NextAuthOptions = {
  events: {
    createUser: async ({ user }) => {
      await addRoleToUser("USER", user.id);
    },
  },
  pages: {
    error: "/login?error=Something went wrong",
  },
  providers: [
    EmailProvider({
      id: "email",
      from: coreConfig.email.from,
      server: {
        host: coreConfig.email.host,
        port: coreConfig.email.port,
        auth: {
          user: coreConfig.email.credentials.username,
          pass: coreConfig.email.credentials.password,
        },
      },
    }),
    GoogleProvider({
      id: "google",
      clientId: coreConfig.google.clientId,
      clientSecret: coreConfig.google.clientSecret,
      allowDangerousEmailAccountLinking: true,
    }),
    FacebookProvider({
      id: "facebook",
      clientId: coreConfig.facebook.clientId,
      clientSecret: coreConfig.facebook.clientSecret,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  callbacks: {
    session: async ({ session, user }) => {
      const dbUser = await db.query.users.findFirst({
        where: eq(users.id, user.id),
        with: {
          roles: true,
        },
      });
      session.user.roles = dbUser!.roles?.map((role) => role.name) ?? [];
      return session;
    },
  },
};

export default config;
