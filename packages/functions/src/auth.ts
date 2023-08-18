import { authConfig, websiteConfig } from "@core/configs";
import { User } from "@core/model";
import { InternalServerErrorResponse, OkResponse } from "@lib/api-responses";
import { createUser, getUserByEmail, updateUser } from "@services/user";
import { APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import * as bcrypt from "bcryptjs";
import { TokenSet } from "openid-client";
import { useBody, usePath } from "sst/node/api";
import {
  AuthHandler,
  FacebookAdapter,
  GoogleAdapter,
  Session,
  createAdapter,
} from "sst/node/auth";

interface EmailPasswordConfig {
  onRegister: (claims: {
    email: string;
    password: string;
  }) => Promise<APIGatewayProxyStructuredResultV2>;
  onLogin: (claims: {
    email: string;
    password: string;
  }) => Promise<APIGatewayProxyStructuredResultV2>;
  onError: (error: any) => Promise<APIGatewayProxyStructuredResultV2>;
}

const EmailPasswordAdapter = createAdapter((config: EmailPasswordConfig) => {
  return async function () {
    const [step] = usePath().slice(-1);
    if (step === "register") {
      try {
        const claims: {
          email: string;
          password: string;
        } = JSON.parse(useBody() || "{}");
        return config.onRegister(claims);
      } catch (error: any) {
        return config.onError(error);
      }
    } else if (step === "login") {
      try {
        const claims: {
          email: string;
          password: string;
        } = JSON.parse(useBody() || "{}");
        return config.onLogin(claims);
      } catch (error: any) {
        return config.onError(error);
      }
    }
    throw new Error("Invalid login step");
  };
});

const SessionResponse = (user: User) => {
  const session = Session.create({
    type: "user",
    options: {
      expiresIn: 1000 * 60 * 60 * 24 * 30, // = 30 days = MS * S * M * H * D
      sub: user.id,
    },
    properties: {
      id: user.id,
    },
  });

  return OkResponse({
    session,
  });
};

const SessionParameter = (user: User) =>
  Session.parameter({
    type: "user",
    options: {
      expiresIn: 1000 * 60 * 60 * 24 * 30, // = 30 days = MS * S * M * H * D
      sub: user.id,
    },
    redirect: `${websiteConfig.url}/auth/callback`,
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
    email: EmailPasswordAdapter({
      onRegister: async (claims) => {
        let user: User | undefined = await getUserByEmail(claims.email);
        if (!user) {
          user = await createUser({
            email: claims.email,
            passwordHash: await bcrypt.hash(
              claims.password,
              authConfig.bcrypt.saltRounds
            ),
          });
        } else {
          return InternalServerErrorResponse("User already exists");
        }
        return SessionResponse(user);
      },
      onLogin: async (claims) => {
        let user: User | undefined = await getUserByEmail(claims.email);
        if (!user) {
          return InternalServerErrorResponse("User not found");
        }
        if (!user.passwordHash) {
          return InternalServerErrorResponse(
            "You may have signed up with a different provider."
          );
        }
        if (!bcrypt.compareSync(claims.password, user.passwordHash)) {
          return InternalServerErrorResponse("Incorrect password");
        }
        return SessionResponse(user);
      },
      onError: async (error) => {
        return InternalServerErrorResponse(
          error.stack || error.message || "Something went wrong"
        );
      },
    }),
  },
});
