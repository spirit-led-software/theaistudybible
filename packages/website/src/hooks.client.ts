import * as Sentry from '@sentry/sveltekit';
import { PUBLIC_API_URL } from '$env/static/public';
import apiConfig from '@revelationsai/client/configs/api';
import type { HandleClientError } from '@sveltejs/kit';

// If you don't want to use Session Replay, remove the `Replay` integration, 
// `replaysSessionSampleRate` and `replaysOnErrorSampleRate` options.
Sentry.init({
    dsn: "https://4e3a10962cce1eb46a534d5720440f95@o4506418175737856.ingest.us.sentry.io/4506418505187328",
    tracesSampleRate: 1,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1,
    integrations: [Sentry.replayIntegration()]
})

apiConfig.url = PUBLIC_API_URL;

export const handleError: HandleClientError = Sentry.handleErrorWithSentry(async ({ error, message }) => {
  console.debug(`Error: ${message}`, error);

  return {
    message: 'Oops! Something went wrong.'
  };
});