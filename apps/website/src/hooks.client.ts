import { env } from '$env/dynamic/public';
import type { HandleClientError } from '@sveltejs/kit';
import { initializeClerkClient } from 'clerk-sveltekit/client';

initializeClerkClient(env.PUBLIC_CLERK_PUBLISHABLE_KEY!, {
  signInUrl: '/sign-in',
  signUpUrl: '/sign-up'
});

export const handleError: HandleClientError = async ({ error, event }) => {
  console.error(error, event);
};
