import { apple } from '@/core/auth/providers/oauth';
import { auth } from '@/www/server/utils/auth';
import type { APIHandler } from '@solidjs/start/server';
import { generateState } from 'arctic';
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
  const authUrl = apple.createAuthorizationURL(state, ['name', 'email']);
  authUrl.searchParams.set('response_mode', 'form_post');

  setCookie(nativeEvent, 'apple_oauth_state', state, {
    httpOnly: true,
    maxAge: 60 * 15,
    secure: import.meta.env.PROD,
    path: '/',
    sameSite: 'none',
  });

  return Promise.resolve(
    new Response(null, { status: 302, headers: { Location: authUrl.toString() } }),
  );
};
