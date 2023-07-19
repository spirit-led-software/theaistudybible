import { authConfig } from "@core/configs/index";
import { createUser, getUserByEmail } from "@core/services/user";
import { User } from "@revelationsai/core/database/model";
import nodemailer from "nodemailer";
import { TokenSet } from "openid-client";
import {
  AuthHandler,
  FacebookAdapter,
  GoogleAdapter,
  LinkAdapter,
  Session,
} from "sst/node/auth";

const emailTransport = nodemailer.createTransport({
  host: authConfig.email.host,
  port: authConfig.email.port,
  auth: {
    user: authConfig.email.credentials.username,
    pass: authConfig.email.credentials.password,
  },
  from: authConfig.email.from,
});

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
    redirect: `${process.env.WEBSITE_URL}/api/auth/callback`,
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
        try {
          const sendMessageInfo = await emailTransport.sendMail({
            to: claims.email,
            from: authConfig.email.from,
            subject: "Login to revelationsAI",
            text: `Click this link to login to revelationsAI: ${link}`,
            replyTo: authConfig.email.replyTo,
          });

          if (sendMessageInfo.rejected.length > 0) {
            return {
              statusCode: 500,
              body: JSON.stringify({
                error: `Failed to send email to ${sendMessageInfo.rejected.join(
                  ", "
                )}`,
              }),
            };
          }

          console.log("Send message response:", sendMessageInfo.response);

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
          redirect: `${process.env.WEBSITE_URL}/api/auth/callback`,
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
