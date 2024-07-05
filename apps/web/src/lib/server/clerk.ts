import { createClerkClient } from '@clerk/clerk-sdk-node';
import { JwtPayload } from '@clerk/types';
import { getRequestEvent } from 'solid-js/web';

export const clerk = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
  publishableKey: process.env.PUBLIC_CLERK_PUBLISHABLE_KEY
});

export type AuthResult =
  | {
      isSignedIn: true;
      userId: string;
      claims: JwtPayload;
    }
  | {
      isSignedIn: false;
      userId?: undefined;
      claims?: undefined;
    };

export function auth(): AuthResult {
  'use server';
  const event = getRequestEvent();
  if (!event) {
    throw new Error('No request event');
  }

  const { locals } = event;

  if (locals.auth?.userId && locals.auth.sessionClaims) {
    return {
      isSignedIn: true,
      userId: locals.auth.userId,
      claims: locals.auth.sessionClaims
    };
  } else {
    return {
      isSignedIn: false,
      userId: undefined,
      claims: undefined
    };
  }
}
