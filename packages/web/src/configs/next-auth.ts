import { PrismaAdapter } from "@auth/prisma-adapter";
import { getUser } from "@chatesv/core/services/user";
import { config as coreConfig } from "@core/configs/auth";
import { prisma } from "@core/services/database";
import { addRoleToUser } from "@core/services/role";
import { NextAuthOptions } from "next-auth";
import { Adapter } from "next-auth/adapters";
import EmailProvider from "next-auth/providers/email";
import FacebookProvider from "next-auth/providers/facebook";
import GoogleProvider from "next-auth/providers/google";

export const config: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  events: {
    createUser: async ({ user }) => {
      const dbUser = await getUser(user.id, {
        throwOnNotFound: true,
      });
      await addRoleToUser("USER", dbUser!);
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
      const dbUser = await getUser(user.id, {
        throwOnNotFound: true,
        include: {
          roles: true,
        },
      });
      session.user.roles = dbUser!.roles?.map((role) => role.name) ?? [];
      return session;
    },
  },
};

export default config;
