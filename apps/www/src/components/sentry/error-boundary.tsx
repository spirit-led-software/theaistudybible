import { withSentryErrorBoundary } from '@sentry/solidstart';
import { ErrorBoundary } from 'solid-js';

export const SentryErrorBoundary = withSentryErrorBoundary(ErrorBoundary);
