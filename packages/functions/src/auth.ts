import { User } from "@chatesv/core/database/model";
import { createUser, getUserByEmail } from "@core/services/user";
import {
  AuthHandler,
  FacebookAdapter,
  GoogleAdapter,
  Session,
} from "sst/node/auth";
import { NextjsSite } from "sst/node/site";

export const handler = AuthHandler({
  providers: {
    facebook: FacebookAdapter({
      clientID: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
      scope: "email, profile",
      onSuccess: async (tokenSet) => {
        console.log(tokenSet);
        let user: User | undefined = await getUserByEmail(
          tokenSet.claims().email!
        );
        if (!user) {
          user = await createUser({
            email: tokenSet.claims().email!,
            name: tokenSet.claims().name!,
            image: tokenSet.claims().picture!,
          });
        }

        return Session.parameter({
          type: "user",
          redirect: `${NextjsSite.Website.url}/callback`,
          properties: {
            id: user.id,
          },
        });
      },
    }),
    google: GoogleAdapter({
      mode: "oauth",
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      scope: "email",
      onSuccess: async (tokenSet) => {
        console.log(tokenSet);
        let user: User | undefined = await getUserByEmail(
          tokenSet.claims().email!
        );
        if (!user) {
          user = await createUser({
            email: tokenSet.claims().email!,
            name: tokenSet.claims().name!,
            image: tokenSet.claims().picture!,
          });
        }

        return Session.parameter({
          type: "user",
          redirect: `${NextjsSite.Website.url}/callback`,
          properties: {
            id: user.id,
          },
        });
      },
    }),
  },
});
