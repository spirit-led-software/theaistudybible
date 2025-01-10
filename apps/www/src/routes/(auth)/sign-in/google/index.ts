import { google } from '@/core/auth/providers/oauth';
import type { APIHandler } from '@solidjs/start/server';
import { generateCodeVerifier, generateState } from 'arctic';
import { setCookie } from 'vinxi/http';

export const GET: APIHandler = ({ nativeEvent }) => {
  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  const url = google.createAuthorizationURL(state, codeVerifier, ['openid', 'profile', 'email']);

  setCookie(nativeEvent, 'google_oauth_state', state, {
    httpOnly: true,
    maxAge: 60 * 10,
    secure: import.meta.env.PROD,
    path: '/',
    sameSite: 'lax',
  });
  setCookie(nativeEvent, 'google_code_verifier', codeVerifier, {
    httpOnly: true,
    maxAge: 60 * 10,
    secure: import.meta.env.PROD,
    path: '/',
    sameSite: 'lax',
  });

  return Promise.resolve(
    new Response(null, {
      status: 302,
      headers: { Location: url.toString() },
    }),
  );
};
