import { authConfig, emailConfig, websiteConfig } from "@core/configs";
import { emailTransport } from "@core/configs/email";
import { User } from "@core/model";
import {
  InternalServerErrorResponse,
  OkResponse,
  RedirectResponse,
} from "@lib/api-responses";
import { createUser, getUserByEmail, updateUser } from "@services/user";
import {
  APIGatewayProxyEventQueryStringParameters,
  APIGatewayProxyStructuredResultV2,
} from "aws-lambda";
import * as bcrypt from "bcryptjs";
import { createSigner, createVerifier } from "fast-jwt";
import { TokenSet } from "openid-client";
import { useBody, useDomainName, usePath, useQueryParams } from "sst/node/api";
import {
  AuthHandler,
  FacebookAdapter,
  GoogleAdapter,
  Session,
  createAdapter,
  getPrivateKey,
  getPublicKey,
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
  onForgotPassword: (
    link: string,
    claims: APIGatewayProxyEventQueryStringParameters
  ) => Promise<APIGatewayProxyStructuredResultV2>;
  onForgotPasswordCallback: (
    token: string
  ) => Promise<APIGatewayProxyStructuredResultV2>;
  onResetPassword: (
    email: string,
    password: string
  ) => Promise<APIGatewayProxyStructuredResultV2>;
  onError: (error: any) => Promise<APIGatewayProxyStructuredResultV2>;
}

const EmailPasswordAdapter = createAdapter((config: EmailPasswordConfig) => {
  const signer = createSigner({
    expiresIn: 1000 * 60 * 10,
    key: getPrivateKey(),
    algorithm: "RS512",
  });
  return async function () {
    const [step] = usePath().slice(-1);
    const forgotPasswordCallback =
      "https://" +
      [
        useDomainName(),
        ...usePath().slice(0, -1),
        "forgot-password-callback",
      ].join("/");
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
    } else if (step === "forgot-password") {
      try {
        const url = new URL(forgotPasswordCallback);
        const claims = useQueryParams();
        const email = claims.email;
        if (!email) {
          return InternalServerErrorResponse("Email is required");
        }
        const user = await getUserByEmail(email);
        if (!user) {
          return InternalServerErrorResponse("User not found");
        }
        url.searchParams.append("token", signer(claims));
        return config.onForgotPassword(url.toString(), claims);
      } catch (error: any) {
        return config.onError(error);
      }
    } else if (step === "forgot-password-callback") {
      try {
        const claims = useQueryParams();
        const token = claims.token;
        if (!token) {
          return InternalServerErrorResponse("Token is required");
        }
        const verifier = createVerifier({
          algorithms: ["RS512"],
          key: getPublicKey(),
        });
        const jwt = verifier(token);
        if (!jwt) {
          return InternalServerErrorResponse("Invalid token");
        }
        const email = jwt.email;
        if (!email) {
          return InternalServerErrorResponse("Email is required");
        }
        return config.onForgotPasswordCallback(token);
      } catch (error: any) {
        return config.onError(error);
      }
    } else if (step === "reset-password") {
      const claims: {
        token: string;
        password: string;
      } = JSON.parse(useBody() || "{}");

      if (!claims.token) {
        return InternalServerErrorResponse("Token is required");
      }
      if (!claims.password) {
        return InternalServerErrorResponse("Password is required");
      }
      const verifier = createVerifier({
        algorithms: ["RS512"],
        key: getPublicKey(),
      });
      const jwt = verifier(claims.token);
      if (!jwt) {
        return InternalServerErrorResponse("Invalid token");
      }
      const email = jwt.email;
      if (!email) {
        return InternalServerErrorResponse("Email is required");
      }
      return config.onResetPassword(email, claims.password);
    } else {
      throw new Error("Invalid login step");
    }
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
          return InternalServerErrorResponse(
            "User already exists with this email"
          );
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
      onForgotPassword: async (link, claims) => {
        const sendMessageInfo = await emailTransport.sendMail({
          to: claims.email,
          from: emailConfig.from,
          subject: "Reset your password",
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
          message: "Password reset email sent",
          claims,
        });
      },
      onForgotPasswordCallback: async (token) => {
        return RedirectResponse(
          `${websiteConfig.url}/auth/forgot-password?token=${token}`
        );
      },
      onResetPassword: async (email, password) => {
        const user = await getUserByEmail(email);
        if (!user) {
          return InternalServerErrorResponse("User not found");
        }
        await updateUser(user.id, {
          passwordHash: await bcrypt.hash(
            password,
            authConfig.bcrypt.saltRounds
          ),
        });
        return OkResponse("Password reset successfully");
      },
      onError: async (error) => {
        return InternalServerErrorResponse(
          error.stack || error.message || "Something went wrong"
        );
      },
    }),
  },
});

const emailLinkHtml = (link: string) => `
<html>
  <head>
    <meta charset="utf-8" />
    <title>Reset password for RevelationsAI</title>
    <style>
      body {
        font-family: sans-serif;
      }
    </style>
  </head>
  <body>
    <p>Click this link to reset your password: <a href="${link}">${link}</a></p>
  </body>
</html>
`;
