import { CLERK_SECRET_KEY } from '$env/static/private';
import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { handleClerk } from 'clerk-sveltekit/server';

export const handle: Handle = sequence(
  handleClerk(CLERK_SECRET_KEY, {
    debug: true
  })
);
