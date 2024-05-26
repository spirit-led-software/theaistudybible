import * as Sentry from '@sentry/sveltekit';
import { PUBLIC_CLERK_PUBLISHABLE_KEY } from '$env/static/public';
import type { HandleClientError } from '@sveltejs/kit';
import { initializeClerkClient } from 'clerk-sveltekit/client';

// If you don't want to use Session Replay, remove the `Replay` integration, 
// `replaysSessionSampleRate` and `replaysOnErrorSampleRate` options.
Sentry.init({
    dsn: "https://6b2ba7dba8669c5e38cb8175e8188079@o4507103632359424.ingest.us.sentry.io/4507306977722368",
    tracesSampleRate: 1,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1,
    integrations: [Sentry.replayIntegration()]
})

initializeClerkClient(PUBLIC_CLERK_PUBLISHABLE_KEY);

export const handleError: HandleClientError = Sentry.handleErrorWithSentry(async ({ error, event }) => {
  console.error(error, event);
});