import { emailConfig, websiteConfig } from "@core/configs";
import { emailTransport } from "@core/configs/email";
import { User } from "@core/model";
import { InternalServerErrorResponse, OkResponse } from "@lib/api-responses";
import { createUser, getUserByEmail, updateUser } from "@services/user";
import { TokenSet } from "openid-client";
import {
  AuthHandler,
  FacebookAdapter,
  GoogleAdapter,
  LinkAdapter,
  Session,
} from "sst/node/auth";

const SessionParameter = (user: User) =>
  Session.parameter({
    type: "user",
    options: {
      expiresIn: 1000 * 60 * 60 * 24 * 30, // = 30 days = MS * S * M * H * D
      sub: user.id,
    },
    redirect: `${websiteConfig.url}/api/auth/callback`,
    properties: {
      id: user.id,
    },
  });

const checkForUserOrCreateFromTokenSet = async (tokenSet: TokenSet) => {
  let user = await getUserByEmail(tokenSet.claims().email!);
  if (!user) {
    user = await createUser({
      email: tokenSet.claims().email!,
      name: tokenSet.claims().name!,
      image: tokenSet.claims().picture!,
    });
  } else {
    if (tokenSet.claims().name && user.name !== tokenSet.claims().name) {
      user = await updateUser(user.id, {
        name: tokenSet.claims().name!,
      });
    }
    if (tokenSet.claims().picture && user.image !== tokenSet.claims().picture) {
      user = await updateUser(user.id, {
        image: tokenSet.claims().picture!,
      });
    }
  }
  return user;
};

export const handler = AuthHandler({
  providers: {
    facebook: FacebookAdapter({
      clientID: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
      scope: "openid email",
      onSuccess: async (tokenSet) => {
        const user = await checkForUserOrCreateFromTokenSet(tokenSet);
        return SessionParameter(user);
      },
    }),
    google: GoogleAdapter({
      mode: "oauth",
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      scope: "openid email",
      onSuccess: async (tokenSet) => {
        const user = await checkForUserOrCreateFromTokenSet(tokenSet);
        return SessionParameter(user);
      },
    }),
    email: LinkAdapter({
      onLink: async (link, claims) => {
        try {
          const sendMessageInfo = await emailTransport.sendMail({
            to: claims.email,
            from: emailConfig.from,
            subject: "Login to revelationsAI",
            replyTo: emailConfig.replyTo,
            html: emailLinkHtml(link),
          });
          if (sendMessageInfo.rejected.length > 0) {
            throw new Error(
              `Failed to send email to ${sendMessageInfo.rejected.join(", ")}`
            );
          }
          console.log("Send message response:", sendMessageInfo.response);

          return OkResponse({
            message: "Login link email sent",
            claims,
          });
        } catch (error: any) {
          console.error(error);
          return InternalServerErrorResponse(error.stack);
        }
      },
      onSuccess: async (claims) => {
        let user: User | undefined = await getUserByEmail(claims.email);
        if (!user) {
          user = await createUser({
            email: claims.email,
          });
        }
        return SessionParameter(user);
      },
      onError: async () => {
        return InternalServerErrorResponse("Failed to login with email link");
      },
    }),
  },
});

const emailLinkHtml = (link: string) => `
<html>
  <head>
    <meta charset="utf-8" />
    <title>revelationsAI</title>
    <style>
      body {
        font-family: sans-serif;
      }
    </style>
  </head>
  <body>
    <p>Click this link to login to revelationsAI: <a href="${link}">${link}</a></p>
  </body>
</html>
`;
