import { lucia } from '@/core/auth/lucia';
import { wrapHandler } from '@sentry/aws-serverless';

export const handler = wrapHandler(async () => {
  await lucia.deleteExpiredSessions();
});
