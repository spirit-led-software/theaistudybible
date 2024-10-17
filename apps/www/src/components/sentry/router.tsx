import { withSentryRouterRouting } from '@sentry/solidstart/solidrouter';
import { Router } from '@solidjs/router';

export const SentryRouter = withSentryRouterRouting(Router);
