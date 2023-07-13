import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@services/database";
import { addRoleToUser } from "@services/role";
import { createUser, getUserByEmail } from "@services/user";
import { NextAuthOptions } from "next-auth";
import { Adapter } from "next-auth/adapters";
import EmailProvider from "next-auth/providers/email";
import FacebookProvider from "next-auth/providers/facebook";
import GoogleProvider from "next-auth/providers/google";

type OAuthProvider = {
  clientId: string;
  clientSecret: string;
};

export type AuthConfig = {
  google: OAuthProvider;
  facebook: OAuthProvider;
  email: {
    from: string;
    host: string;
    port: number;
    credentials: {
      username: string;
      password: string;
    };
  };
  adminUser: {
    email: string;
    password: string;
  };
};

export const config: AuthConfig = {
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  },
  facebook: {
    clientId: process.env.FACEBOOK_CLIENT_ID!,
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
  },
  email: {
    from: process.env.EMAIL_FROM!,
    host: process.env.EMAIL_SERVER_HOST!,
    port: parseInt(process.env.EMAIL_SERVER_PORT!),
    credentials: {
      username: process.env.EMAIL_SERVER_USERNAME!,
      password: process.env.EMAIL_SERVER_PASSWORD!,
    },
  },
  adminUser: {
    email: process.env.ADMIN_EMAIL!,
    password: process.env.ADMIN_PASSWORD!,
  },
};

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  providers: [
    EmailProvider({
      id: "email",
      from: config.email.from,
      server: {
        host: config.email.host,
        port: config.email.port,
        auth: {
          user: config.email.credentials.username,
          pass: config.email.credentials.password,
        },
      },
    }),
    GoogleProvider({
      id: "google",
      clientId: config.google.clientId,
      clientSecret: config.google.clientSecret,
    }),
    FacebookProvider({
      id: "facebook",
      clientId: config.facebook.clientId,
      clientSecret: config.facebook.clientSecret,
    }),
  ],
  callbacks: {
    session: async ({ session, user }) => {
      let dbUser = await getUserByEmail(user.email, {
        throwOnNotFound: false,
        include: {
          roles: true,
        },
      });
      if (!dbUser) {
        await createUser({
          email: user.email,
          name: user.name,
          image: user.image,
          roles: {
            connect: [
              {
                name: "USER",
              },
            ],
          },
        });
        dbUser = await getUserByEmail(user.email, {
          include: {
            roles: true,
          },
        });
      }
      if (!dbUser?.roles?.some((role) => role.name === "USER")) {
        const { user: updatedDbUser } = await addRoleToUser("USER", dbUser!);
        dbUser = updatedDbUser;
      }
      session.user.roles = dbUser.roles?.map((role) => role.name) ?? [];
      return session;
    },
  },
};

export default config;
