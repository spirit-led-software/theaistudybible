import { PUBLIC_CLERK_PUBLISHABLE_KEY } from '$env/static/public';
import type { HandleClientError } from '@sveltejs/kit';
import { initializeClerkClient } from 'clerk-sveltekit/client';

initializeClerkClient(PUBLIC_CLERK_PUBLISHABLE_KEY);

export const handleError: HandleClientError = async ({ error, event }) => {
  console.error(error, event);
};
