import { lucia } from '@/core/auth';
import { apple } from '@/core/auth/providers/oauth';
import { db } from '@/core/database';
import { users } from '@/core/database/schema';
import { ObjectParser } from '@pilcrowjs/object-parser';
import type { APIHandler } from '@solidjs/start/server';
import { decodeIdToken } from 'arctic';
import type { OAuth2Tokens } from 'arctic';
import { getCookie, setCookie } from 'vinxi/http';

export const POST: APIHandler = async ({ nativeEvent, request }) => {
  const storedState = getCookie(nativeEvent, 'apple_oauth_state');
  const body = await request.formData();
  const code = body.get('code') as string | null;
  const state = body.get('state') as string | null;

  if (!storedState || !code || !state) {
    return new Response('Missing required parameters.', {
      status: 400,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
  if (storedState !== state) {
    return new Response('Invalid state.', {
      status: 400,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  let tokens: OAuth2Tokens;
  try {
    tokens = await apple.validateAuthorizationCode(code);
  } catch {
    return new Response('Invalid authorization code.', {
      status: 400,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  const claims = decodeIdToken(tokens.idToken());
  const claimsParser = new ObjectParser(claims);

  const appleId = claimsParser.getString('sub');
  const name = claimsParser.getObject('name') as { firstName: string; lastName: string };
  const email = claimsParser.getString('email');

  const existingUserByEmail = await db.query.users.findFirst({
    where: (table, { eq }) => eq(table.email, email),
  });
  if (existingUserByEmail && existingUserByEmail.appleId !== appleId) {
    return new Response(
      'A user already exists with this email address. You may have signed up with a different method.',
      { status: 400, headers: { 'Content-Type': 'text/plain' } },
    );
  }

  const existingUserByAppleId = await db.query.users.findFirst({
    where: (table, { eq }) => eq(table.appleId, appleId),
  });
  if (existingUserByAppleId) {
    const sessionToken = lucia.sessions.generateSessionToken();
    const session = await lucia.sessions.createSession(sessionToken, existingUserByAppleId.id);
    const sessionCookie = lucia.cookies.createSessionCookie(sessionToken, session);
    setCookie(nativeEvent, sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
    return new Response(null, {
      status: 302,
      headers: { Location: '/' },
    });
  }

  const [user] = await db
    .insert(users)
    .values({
      appleId,
      email,
      firstName: name.firstName,
      lastName: name.lastName,
    })
    .returning();

  const sessionToken = lucia.sessions.generateSessionToken();
  const session = await lucia.sessions.createSession(sessionToken, user.id);
  const sessionCookie = lucia.cookies.createSessionCookie(sessionToken, session);
  setCookie(nativeEvent, sessionCookie.name, sessionCookie.value, sessionCookie.attributes);

  return new Response(null, {
    status: 302,
    headers: { Location: '/' },
  });
};
