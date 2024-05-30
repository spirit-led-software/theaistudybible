import { env } from '$env/dynamic/private';
import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { handleClerk } from 'clerk-sveltekit/server';

export const handle: Handle = sequence(
  handleClerk(env.CLERK_SECRET_KEY!, {
    signInUrl: '/sign-in'
  })
);
