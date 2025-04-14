import { apple } from '@/core/auth/providers/oauth';
import { authenticate } from '@/www/server/utils/authenticate';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { setCookie } from '@tanstack/react-start/server';
import { generateState } from 'arctic';

export const APIRoute = createAPIFileRoute('/api/auth/apple/authorize')({
  GET: async ({ request }) => {
    const { session, user } = await authenticate();
    if (session && user) {
      return Promise.resolve(new Response(null, { status: 302, headers: { Location: '/' } }));
    }

    const url = new URL(request.url);
    const redirectUrl = url.searchParams.get('redirectUrl');
    if (redirectUrl) {
      setCookie('redirect_url', redirectUrl, {
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

    setCookie('apple_oauth_state', state, {
      httpOnly: true,
      maxAge: 60 * 15,
      secure: import.meta.env.PROD,
      path: '/',
      sameSite: 'none',
    });

    return Promise.resolve(
      new Response(null, { status: 302, headers: { Location: authUrl.toString() } }),
    );
  },
});
