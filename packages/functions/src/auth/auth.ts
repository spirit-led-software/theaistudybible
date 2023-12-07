import { emailConfig, websiteConfig } from '@core/configs';
import { emailTransport } from '@core/configs/email';
import type { User } from '@core/model';
import {
  BadRequestResponse,
  InternalServerErrorResponse,
  OkResponse,
  RedirectResponse
} from '@lib/api-responses';
import { addRoleToUser, doesUserHaveRole } from '@services/role';
import { createUser, getUserByEmail, updateUser } from '@services/user';
import {
  createUserPassword,
  getUserPasswordByUserId,
  updateUserPassword
} from '@services/user/password';
import argon from 'argon2';
import { randomBytes } from 'crypto';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import type { TokenSet } from 'openid-client';
import path from 'path';
import pug from 'pug';
import { AuthHandler, GoogleAdapter, Session } from 'sst/node/auth';
import Stripe from 'stripe';
import { stripeConfig } from '../configs';
import { AppleAdapter, CredentialsAdapter } from './providers';

const SessionParameter = (user: User, url?: string) =>
  Session.parameter({
    type: 'user',
    options: {
      expiresIn: 1000 * 60 * 60 * 24 * 7, // = 7 days = MS * S * M * H * D
      sub: user.id
    },
    redirect: url || `${websiteConfig.authUrl}/callback`,
    properties: {
      id: user.id
    }
  });

const AppleClientSecret = () => {
  const audience = 'https://appleid.apple.com';
  const keyId = process.env.APPLE_KEY_ID!;
  const teamId = process.env.APPLE_TEAM_ID!;
  const clientId = process.env.APPLE_CLIENT_ID!;

  const privateKey = fs.readFileSync(path.resolve('apple-auth-key.p8')).toString();

  const clientSecret = jwt.sign(
    {
      iss: teamId,
      iat: Math.floor(Date.now() / 1000) - 30, // 30 seconds ago
      exp: Math.floor(Date.now() / 1000) + 86400 * 180, // 180 days
      aud: audience,
      sub: clientId
    },
    privateKey,
    {
      algorithm: 'ES256',
      header: {
        alg: 'ES256',
        kid: keyId
      }
    }
  );

  return clientSecret;
};

const appleClientSecret = AppleClientSecret();

const checkForUserOrCreateFromTokenSet = async (tokenSet: TokenSet) => {
  let user = await getUserByEmail(tokenSet.claims().email!);
  if (!user) {
    user = await createUser({
      email: tokenSet.claims().email!,
      name: tokenSet.claims().name!,
      image: tokenSet.claims().picture!,
      customImage: false
    });
  } else {
    if (tokenSet.claims().name && user.name !== tokenSet.claims().name) {
      user = await updateUser(user.id, {
        name: tokenSet.claims().name!
      });
    }
    if (
      tokenSet.claims().picture &&
      user.image !== tokenSet.claims().picture &&
      !user.customImage
    ) {
      user = await updateUser(user.id, {
        image: tokenSet.claims().picture!,
        customImage: false
      });
    }
  }

  await doesUserHaveRole('user', user.id).then(async (hasRole) => {
    if (!hasRole) await addRoleToUser('user', user!.id);
  });

  if (!user.stripeCustomerId) {
    user = await createStripeCustomer(user);
  }

  return user;
};

async function createStripeCustomer(user: User) {
  const stripe = new Stripe(stripeConfig.apiKey, {
    apiVersion: '2023-10-16'
  });

  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name || undefined
  });

  user = await updateUser(user.id, {
    stripeCustomerId: customer.id
  });

  return user;
}

const createGoogleAdapter = (callbackUrl?: string) =>
  GoogleAdapter({
    mode: 'oidc',
    clientID: process.env.GOOGLE_CLIENT_ID!,
    onSuccess: async (tokenSet) => {
      const user = await checkForUserOrCreateFromTokenSet(tokenSet);
      return SessionParameter(user, callbackUrl);
    }
  });

const createAppleAdapter = (callbackUrl?: string) =>
  AppleAdapter({
    clientID: process.env.APPLE_CLIENT_ID!,
    clientSecret: appleClientSecret,
    scope: 'openid name email',
    onSuccess: async (tokenSet) => {
      const user = await checkForUserOrCreateFromTokenSet(tokenSet);
      return SessionParameter(user, callbackUrl);
    }
  });

const createCredentialsAdapter = (callbackUrlBase: string = websiteConfig.authUrl) =>
  CredentialsAdapter({
    onRegister: async (link, claims) => {
      const htmlCompileFunction = pug.compileFile('emails/verify-email/html.pug');
      const html = htmlCompileFunction({
        link
      });
      const sendEmailResponse = await emailTransport.sendMail({
        from: emailConfig.from,
        replyTo: emailConfig.replyTo,
        to: claims.email,
        subject: 'Verify your email',
        html
      });

      if (sendEmailResponse.rejected.length > 0) {
        return InternalServerErrorResponse('Failed to send verification email');
      }

      return OkResponse({
        message: 'Verify email sent'
      });
    },
    onRegisterCallback: async (email, password) => {
      let user: User | undefined = await getUserByEmail(email);
      if (!user) {
        user = await createUser({
          email: email
        });

        const salt = randomBytes(16).toString('hex');
        await createUserPassword({
          userId: user.id,
          passwordHash: await argon.hash(`${password}${salt}`),
          salt: Buffer.from(salt, 'hex').toString('base64')
        });

        await addRoleToUser('user', user.id);
        await createStripeCustomer(user);
      } else {
        return BadRequestResponse('A user already exists with this email');
      }
      return SessionParameter(user, `${callbackUrlBase}/callback`);
    },
    onLogin: async (claims) => {
      let user: User | undefined = await getUserByEmail(claims.email);
      if (!user) {
        return InternalServerErrorResponse('User not found');
      }

      const password = await getUserPasswordByUserId(user.id);
      if (!password) {
        return BadRequestResponse(
          'You may have signed up with a different provider. Try using facebook or google to login.'
        );
      }

      const decodedSalt = Buffer.from(password.salt, 'base64').toString('hex');
      const validPassword = await argon.verify(
        password.passwordHash,
        `${claims.password}${decodedSalt}`
      );
      if (!validPassword) {
        return BadRequestResponse('Incorrect password');
      }

      await doesUserHaveRole('user', user.id).then(async (hasRole) => {
        if (!hasRole) await addRoleToUser('user', user!.id);
      });
      if (!user.stripeCustomerId) {
        user = await createStripeCustomer(user);
      }

      return SessionParameter(user, `${callbackUrlBase}/callback`);
    },
    onForgotPassword: async (link, claims) => {
      const htmlCompileFunction = pug.compileFile('emails/reset-password/html.pug');
      const html = htmlCompileFunction({
        link
      });
      const sendEmailResponse = await emailTransport.sendMail({
        from: emailConfig.from,
        replyTo: emailConfig.replyTo,
        to: claims.email,
        subject: 'Reset Your Password',
        html
      });

      if (sendEmailResponse.rejected.length > 0) {
        return InternalServerErrorResponse('Failed to send password reset email');
      }
      return OkResponse({
        message: 'Password reset email sent'
      });
    },
    onForgotPasswordCallback: async (token) => {
      return RedirectResponse(`${callbackUrlBase}/forgot-password?token=${token}`);
    },
    onResetPassword: async (email, password) => {
      const user = await getUserByEmail(email);
      if (!user) {
        return InternalServerErrorResponse('User not found');
      }

      const userPassword = await getUserPasswordByUserId(user.id);
      if (!userPassword) {
        return BadRequestResponse(
          'User does not have a password, you may have signed up with a different provider. Try using facebook or google to login.'
        );
      }

      const decodedSalt = Buffer.from(userPassword.salt, 'base64').toString('hex');
      const validPassword = await argon.verify(
        userPassword.passwordHash,
        `${password}${decodedSalt}`
      );
      if (validPassword) {
        return BadRequestResponse('Password cannot be the same as the old password');
      }

      const salt = randomBytes(16).toString('hex');
      await updateUserPassword(userPassword.id, {
        passwordHash: await argon.hash(`${password}${salt}`),
        salt: Buffer.from(salt, 'hex').toString('base64')
      });

      return OkResponse('Password reset successfully');
    },
    onError: async (error) => {
      console.error(JSON.stringify(error));
      if (error instanceof Error) {
        return InternalServerErrorResponse(error.stack || error.message || 'Something went wrong');
      } else {
        return InternalServerErrorResponse(`Something went wrong: ${JSON.stringify(error)}`);
      }
    }
  });

export const handler = AuthHandler({
  providers: {
    google: createGoogleAdapter(),
    'google-mobile': createGoogleAdapter('revelationsai://revelationsai/auth/callback'),
    apple: createAppleAdapter(),
    'apple-mobile': createAppleAdapter('revelationsai://revelationsai/auth/callback'),
    credentials: createCredentialsAdapter(),
    'credentials-mobile': createCredentialsAdapter('revelationsai://revelationsai/auth')
  }
});
