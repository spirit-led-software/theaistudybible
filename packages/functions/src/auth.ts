import { User } from "@chatesv/core/database/model";
import { authConfig } from "@core/configs/index";
import { createUser, getUserByEmail } from "@core/services/user";
import nodemailer from "nodemailer";
import { TokenSet } from "openid-client";
import {
  AuthHandler,
  FacebookAdapter,
  GoogleAdapter,
  LinkAdapter,
  Session,
} from "sst/node/auth";

const checkForUserOrCreateFromTokenSet = async (tokenSet: TokenSet) => {
  let user: User | undefined = await getUserByEmail(tokenSet.claims().email!);
  if (!user) {
    user = await createUser({
      email: tokenSet.claims().email!,
      name: tokenSet.claims().name!,
      image: tokenSet.claims().picture!,
    });
  }

  return Session.parameter({
    type: "user",
    redirect: `${
      process.env.WEBSITE_URL ?? "http://localhost:3000"
    }/api/auth/callback`,
    properties: {
      id: user.id,
    },
  });
};

export const handler = AuthHandler({
  providers: {
    facebook: FacebookAdapter({
      clientID: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
      scope: "email, profile",
      onSuccess: async (tokenSet) => {
        return checkForUserOrCreateFromTokenSet(tokenSet);
      },
    }),
    google: GoogleAdapter({
      mode: "oauth",
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      scope: "email",
      onSuccess: async (tokenSet) => {
        return checkForUserOrCreateFromTokenSet(tokenSet);
      },
    }),
    email: LinkAdapter({
      onLink: async (link, claims) => {
        console.log("Claims", claims);
        try {
          const transport = nodemailer.createTransport({
            host: authConfig.email.host,
            port: authConfig.email.port,
            auth: {
              user: authConfig.email.credentials.username,
              pass: authConfig.email.credentials.password,
            },
            from: authConfig.email.from,
          });

          transport.sendMail({
            to: claims.email,
            from: authConfig.email.from,
            subject: "Login to Chatesv",
            text: `Click this link to login to Chatesv: ${link}`,
          });

          return {
            statusCode: 200,
            body: JSON.stringify({
              link,
              claims,
            }),
          };
        } catch (error) {
          console.error(error);
          return {
            statusCode: 500,
            body: JSON.stringify({
              error: "Something went wrong",
            }),
          };
        }
      },
      onSuccess: async (claims) => {
        let user: User | undefined = await getUserByEmail(claims.email);
        if (!user) {
          user = await createUser({
            email: claims.email,
          });
        }

        return Session.parameter({
          type: "user",
          redirect: `${
            process.env.WEBSITE_URL ?? "http://localhost:3000"
          }/api/auth/callback`,
          properties: {
            id: user.id,
          },
        });
      },
      onError: async () => {
        return {
          statusCode: 500,
          body: JSON.stringify({
            error: "Something went wrong",
          }),
        };
      },
    }),
  },
});
