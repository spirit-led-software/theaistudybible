import { authConfig, emailConfig, websiteConfig } from "@core/configs";
import { emailTransport } from "@core/configs/email";
import { User } from "@core/model";
import {
  BadRequestResponse,
  InternalServerErrorResponse,
  OkResponse,
  RedirectResponse,
} from "@lib/api-responses";
import { addRoleToUser, doesUserHaveRole } from "@services/role";
import { createUser, getUserByEmail, updateUser } from "@services/user";
import * as bcrypt from "bcryptjs";
import { TokenSet } from "openid-client";
import pug from "pug";
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

const SessionParameter = (user: User, url?: string) =>
  Session.parameter({
    type: "user",
    options: {
      expiresIn: 1000 * 60 * 60 * 24 * 30, // = 30 days = MS * S * M * H * D
      sub: user.id,
    },
    redirect: url || `${websiteConfig.url}/auth/callback`,
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

  if (!(await doesUserHaveRole("user", user.id))) {
    await addRoleToUser("user", user.id);
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
    "facebook-mobile": FacebookAdapter({
      clientID: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
      scope: "openid email",
      onSuccess: async (tokenSet) => {
        const user = await checkForUserOrCreateFromTokenSet(tokenSet);
        return SessionParameter(
          user,
          "revelationsai://revelationsai/auth/callback"
        );
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
    "google-mobile": GoogleAdapter({
      mode: "oauth",
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      scope: "openid email",
      onSuccess: async (tokenSet) => {
        const user = await checkForUserOrCreateFromTokenSet(tokenSet);
        return SessionParameter(
          user,
          "revelationsai://revelationsai/auth/callback"
        );
      },
    }),
    credentials: CredentialsAdapter({
      onRegister: async (link, claims) => {
        const htmlCompileFunction = pug.compileFile(
          "emails/verify-email/html.pug"
        );
        const html = htmlCompileFunction({
          link,
        });
        const sendEmailResponse = await emailTransport.sendMail({
          from: emailConfig.from,
          replyTo: emailConfig.replyTo,
          to: claims.email,
          subject: "Verify your email",
          html,
        });

        if (sendEmailResponse.rejected.length > 0) {
          return InternalServerErrorResponse(
            "Failed to send verification email"
          );
        }

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
          await addRoleToUser("user", user.id);
        } else {
          return BadRequestResponse("A user already exists with this email");
        }
        return SessionParameter(user);
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
        const htmlCompileFunction = pug.compileFile(
          "emails/reset-password/html.pug"
        );
        const html = htmlCompileFunction({
          link,
        });
        const sendEmailResponse = await emailTransport.sendMail({
          from: emailConfig.from,
          replyTo: emailConfig.replyTo,
          to: claims.email,
          subject: "Reset Your Password",
          html,
        });

        if (sendEmailResponse.rejected.length > 0) {
          return InternalServerErrorResponse(
            "Failed to send password reset email"
          );
        }
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
    "credentials-mobile": CredentialsAdapter({
      onRegister: async (link, claims) => {
        const htmlCompileFunction = pug.compileFile(
          "emails/verify-email/html.pug"
        );
        const html = htmlCompileFunction({
          link,
        });
        const sendEmailResponse = await emailTransport.sendMail({
          from: emailConfig.from,
          replyTo: emailConfig.replyTo,
          to: claims.email,
          subject: "Verify your email",
          html,
        });

        if (sendEmailResponse.rejected.length > 0) {
          return InternalServerErrorResponse(
            "Failed to send verification email"
          );
        }

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
          await addRoleToUser(user.id, "user");
        } else {
          return BadRequestResponse("A user already exists with this email");
        }
        return SessionParameter(
          user,
          "revelationsai://revelationsai/auth/callback"
        );
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
        const htmlCompileFunction = pug.compileFile(
          "emails/reset-password/html.pug"
        );
        const html = htmlCompileFunction({
          link,
        });
        const sendEmailResponse = await emailTransport.sendMail({
          from: emailConfig.from,
          replyTo: emailConfig.replyTo,
          to: claims.email,
          subject: "Reset Your Password",
          html,
        });

        if (sendEmailResponse.rejected.length > 0) {
          return InternalServerErrorResponse(
            "Failed to send password reset email"
          );
        }
        return OkResponse({
          message: "Password reset email sent",
        });
      },
      onForgotPasswordCallback: async (token) => {
        return RedirectResponse(
          `revelationsai://revelationsai/auth/forgot-password?token=${token}`
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
