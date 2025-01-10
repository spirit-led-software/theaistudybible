import { apple } from '@/core/auth/providers/oauth';
import type { APIHandler } from '@solidjs/start/server';
import { generateState } from 'arctic';
import { setCookie } from 'vinxi/http';

export const GET: APIHandler = ({ nativeEvent }) => {
  const state = generateState();
  const url = apple.createAuthorizationURL(state, ['name', 'email']);
  url.searchParams.set('response_mode', 'form_post');

  setCookie(nativeEvent, 'state', state, {
    httpOnly: true,
    maxAge: 60 * 10,
    secure: import.meta.env.PROD,
    path: '/',
    sameSite: 'none',
  });

  return Promise.resolve(
    new Response(null, {
      status: 302,
      headers: { Location: url.toString() },
    }),
  );
};
