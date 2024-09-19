import * as Sentry from '@sentry/solidstart';
import { ErrorBoundary } from 'solid-js';

export const SentryErrorBoundary = Sentry.withSentryErrorBoundary(ErrorBoundary);
