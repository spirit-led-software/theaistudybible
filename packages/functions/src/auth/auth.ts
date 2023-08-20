import { authConfig, emailConfig, websiteConfig } from "@core/configs";
import { emailTransport } from "@core/configs/email";
import { User } from "@core/model";
import {
  BadRequestResponse,
  InternalServerErrorResponse,
  OkResponse,
  RedirectResponse,
} from "@lib/api-responses";
import { createUser, getUserByEmail, updateUser } from "@services/user";
import * as bcrypt from "bcryptjs";
import Email from "email-templates";
import { TokenSet } from "openid-client";
import {
  AuthHandler,
  FacebookAdapter,
  GoogleAdapter,
  Session,
} from "sst/node/auth";
import { CredentialsAdapter } from "./providers";

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
    credentials: CredentialsAdapter({
      onRegister: async (link, claims) => {
        const template = new Email({
          message: {
            from: emailConfig.from,
            replyTo: emailConfig.replyTo,
            subject: "Verify your email",
          },
          transport: emailTransport,
        });
        await template.send({
          template: "verify-email",
          message: {
            to: claims.email,
          },
          locals: {
            link,
          },
        });
        return OkResponse({
          message: "Verify email sent",
        });
      },
      onRegisterCallback: async (email, password) => {
        let user: User | undefined = await getUserByEmail(email);
        if (!user) {
          user = await createUser({
            email: email,
            passwordHash: await bcrypt.hash(
              password,
              authConfig.bcrypt.saltRounds
            ),
          });
        } else {
          return BadRequestResponse("A user already exists with this email");
        }
        return SessionResponse(user);
      },
      onLogin: async (claims) => {
        let user: User | undefined = await getUserByEmail(claims.email);
        if (!user) {
          return InternalServerErrorResponse("User not found");
        }
        if (!user.passwordHash) {
          return BadRequestResponse(
            "You may have signed up with a different provider. Try using facebook or google to login."
          );
        }
        if (!bcrypt.compareSync(claims.password, user.passwordHash)) {
          return BadRequestResponse("Incorrect password");
        }
        return SessionResponse(user);
      },
      onForgotPassword: async (link, claims) => {
        const template = new Email({
          message: {
            from: emailConfig.from,
            replyTo: emailConfig.replyTo,
            subject: "Reset your password",
          },
          transport: emailTransport,
        });
        await template.send({
          template: "reset-password",
          message: {
            to: claims.email,
          },
          locals: {
            link,
          },
        });
        return OkResponse({
          message: "Password reset email sent",
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

        if (
          user.passwordHash &&
          bcrypt.compareSync(password, user.passwordHash)
        ) {
          return BadRequestResponse(
            "Password cannot be the same as the old password"
          );
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

const verifyEmailHtml = (link: string) => `
<html>
  <head>
    <meta charset="utf-8" />
    <title>Verify Email for RevelationsAI</title>
    <style>
      body {
        font-family: sans-serif;
      }
    </style>
  </head>
  <body>
    <p>Click this link to verify your email: <a href="${link}">${link}</a></p>
  </body>
</html>
`;

const resetPasswordHtml = (link: string) => `
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
