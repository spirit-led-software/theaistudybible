import { google } from '@/core/auth/providers/oauth';
import { auth } from '@/www/server/utils/auth';
import type { APIHandler } from '@solidjs/start/server';
import { generateCodeVerifier, generateState } from 'arctic';
import { setCookie } from 'vinxi/http';

export const GET: APIHandler = ({ nativeEvent, request }) => {
  const { session, user } = auth();
  if (session && user) {
    return Promise.resolve(new Response(null, { status: 302, headers: { Location: '/' } }));
  }

  const url = new URL(request.url);
  const redirectUrl = url.searchParams.get('redirectUrl');
  if (redirectUrl) {
    setCookie(nativeEvent, 'redirect_url', redirectUrl, {
      httpOnly: true,
      maxAge: 60 * 10,
      secure: import.meta.env.PROD,
      path: '/',
      sameSite: 'lax',
    });
  }

  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  const authUrl = google.createAuthorizationURL(state, codeVerifier, [
    'openid',
    'profile',
    'email',
  ]);

  setCookie(nativeEvent, 'google_oauth_state', state, {
    httpOnly: true,
    maxAge: 60 * 15,
    secure: import.meta.env.PROD,
    path: '/',
    sameSite: 'lax',
  });
  setCookie(nativeEvent, 'google_code_verifier', codeVerifier, {
    httpOnly: true,
    maxAge: 60 * 15,
    secure: import.meta.env.PROD,
    path: '/',
    sameSite: 'lax',
  });

  return Promise.resolve(
    new Response(null, { status: 302, headers: { Location: authUrl.toString() } }),
  );
};
