import {sequence} from '@sveltejs/kit/hooks';
import * as Sentry from '@sentry/sveltekit';
import { PUBLIC_API_URL, PUBLIC_WEBSITE_URL } from '$env/static/public';
import apiConfig from '@revelationsai/client/configs/api';
import { commonCookies } from '@revelationsai/client/utils/cookies';
import { validNonApiHandlerSession } from '@revelationsai/server/services/session';
import type { Handle, HandleServerError } from '@sveltejs/kit';

Sentry.init({
    dsn: "https://4e3a10962cce1eb46a534d5720440f95@o4506418175737856.ingest.us.sentry.io/4506418505187328",
    tracesSampleRate: 1
})

apiConfig.url = PUBLIC_API_URL;

export const handle: Handle = sequence(Sentry.sentryHandle(), async ({ resolve, event }) => {
  try {
    const session = event.cookies.get(commonCookies.session);
    if (!session) {
      console.debug('No session found');
      event.locals.user = undefined;
      event.locals.session = undefined;
      return resolve(event);
    }

    const sessionInfo = await validNonApiHandlerSession(session);
    if (!sessionInfo.isValid) {
      event.cookies.delete(commonCookies.session, {
        domain: new URL(PUBLIC_WEBSITE_URL).hostname,
        path: '/'
      });
      throw new Error('Invalid session');
    }

    event.locals.user = {
      ...sessionInfo.userWithRoles,
      maxQueries: sessionInfo.maxQueries,
      remainingQueries: sessionInfo.remainingQueries,
      maxGeneratedImages: sessionInfo.maxGeneratedImages,
      remainingGeneratedImages: sessionInfo.remainingGeneratedImages
    };
    event.locals.session = session;
  } catch (error) {
    console.debug('Error authorizing user:', error);
    // Unauthorized
    event.locals.user = undefined;
    event.locals.session = undefined;
  }

  return resolve(event);
});

export const handleError: HandleServerError = Sentry.handleErrorWithSentry(({ error, message }) => {
  console.debug(`Error: ${message}`, error);

  return {
    message: 'Oops! Something went wrong.'
  };
});