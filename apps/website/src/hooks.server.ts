import * as Sentry from '@sentry/sveltekit';
import { CLERK_SECRET_KEY } from '$env/static/private';
import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { handleClerk } from 'clerk-sveltekit/server';

Sentry.init({
    dsn: "https://6b2ba7dba8669c5e38cb8175e8188079@o4507103632359424.ingest.us.sentry.io/4507306977722368",
    tracesSampleRate: 1
})

export const handle: Handle = sequence(Sentry.sentryHandle(), sequence(
  handleClerk(CLERK_SECRET_KEY, {
    debug: true
  })
));
export const handleError = Sentry.handleErrorWithSentry();