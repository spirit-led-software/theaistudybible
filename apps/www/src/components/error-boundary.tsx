import * as Sentry from '@sentry/solid';
import { ErrorBoundary } from 'solid-js';

export const SentryErrorBoundary = Sentry.withSentryErrorBoundary(ErrorBoundary);
