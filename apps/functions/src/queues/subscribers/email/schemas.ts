import { z } from 'zod';

export const EmailQueueRecordSchema = z.object({
  subject: z.string(),
  to: z.string().email().array(),
  cc: z.string().email().array().optional(),
  bcc: z.string().email().array().optional(),
  html: z.string(),
});
