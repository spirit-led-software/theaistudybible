import { PUBLIC_WEBSITE_URL } from '$env/static/public';
import { commonCookies } from '@revelationsai/client/utils/cookies';
import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ url, cookies }) => {
  const { searchParams } = url;
  const token = searchParams.get('token');
  if (!token) {
    redirect(307, '/sign-in');
  }
  cookies.set(commonCookies.session, token, {
    domain: new URL(PUBLIC_WEBSITE_URL).hostname,
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days,
    secure: true
  });
  redirect(307, cookies.get(commonCookies.returnUrl) || PUBLIC_WEBSITE_URL);
};
