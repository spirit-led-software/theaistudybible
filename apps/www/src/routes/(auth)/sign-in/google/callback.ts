import { lucia } from '@/core/auth';
import { google } from '@/core/auth/providers/oauth';
import { db } from '@/core/database';
import { users } from '@/core/database/schema';
import { ObjectParser } from '@pilcrowjs/object-parser';
import type { APIHandler } from '@solidjs/start/server';
import { decodeIdToken } from 'arctic';
import type { OAuth2Tokens } from 'arctic';
import { Resource } from 'sst';
import { getCookie, setCookie } from 'vinxi/http';

export const GET: APIHandler = async ({ nativeEvent, request }) => {
  const storedState = getCookie(nativeEvent, 'google_oauth_state');
  const codeVerifier = getCookie(nativeEvent, 'google_code_verifier');
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  if (!storedState || !codeVerifier || !code || !state) {
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
    tokens = await google.validateAuthorizationCode(code, codeVerifier);
  } catch {
    return new Response('Invalid authorization code.', {
      status: 400,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  const claims = decodeIdToken(tokens.idToken());
  const claimsParser = new ObjectParser(claims);

  const googleId = claimsParser.getString('sub');
  const expirationDate = claimsParser.getNumber('exp');
  if (expirationDate < new Date().getTime()) {
    return new Response('Token expired.', {
      status: 400,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  const name = claimsParser.getString('name');
  const picture = claimsParser.getString('picture');
  const email = claimsParser.getString('email');

  const existingUserByEmail = await db.query.users.findFirst({
    where: (table, { eq }) => eq(table.email, email),
  });
  if (existingUserByEmail && existingUserByEmail.googleId !== googleId) {
    return new Response(
      'A user already exists with this email address. You may have signed up with a different method.',
      { status: 400, headers: { 'Content-Type': 'text/plain' } },
    );
  }

  const existingUserByGoogleId = await db.query.users.findFirst({
    where: (table, { eq }) => eq(table.googleId, googleId),
  });
  if (existingUserByGoogleId) {
    const sessionToken = lucia.sessions.generateSessionToken();
    await lucia.sessions.createSession(sessionToken, existingUserByGoogleId.id);
    const sessionCookie = lucia.cookies.createSessionCookie(sessionToken);
    setCookie(nativeEvent, sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
    return new Response(null, {
      status: 302,
      headers: { Location: `${Resource.WebAppUrl.value}/` },
    });
  }

  const [user] = await db
    .insert(users)
    .values({
      googleId,
      email,
      firstName: name.split(' ')[0],
      lastName: name.split(' ')[1],
      image: picture,
    })
    .returning();
  const sessionToken = lucia.sessions.generateSessionToken();
  await lucia.sessions.createSession(sessionToken, user.id);
  const sessionCookie = lucia.cookies.createSessionCookie(sessionToken);
  setCookie(nativeEvent, sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
  return new Response(null, {
    status: 302,
    headers: { Location: `${Resource.WebAppUrl.value}/` },
  });
};
