import { z } from 'zod';
import { ForgotPasswordEmailSchema } from './auth/forgot-password';
import { DailyDevotionEmailSchema } from './daily-devotion';
import { DeadLetterEmailSchema } from './dead-letter';

export const EmailBodySchema = z.union([
  z.string(),
  z.union([ForgotPasswordEmailSchema, DeadLetterEmailSchema, DailyDevotionEmailSchema]),
]);

export const EmailQueueRecordSchema = z.object({
  subject: z.string(),
  to: z.string().email().array(),
  cc: z.string().email().array().optional(),
  bcc: z.string().email().array().optional(),
  body: EmailBodySchema,
});
