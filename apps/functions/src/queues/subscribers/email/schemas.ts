import { z } from 'zod';

export const EmailQueueRecordSchema = z.object({
  subject: z.string(),
  to: z.string().array(),
  cc: z.string().array().optional(),
  bcc: z.string().array().optional(),
  html: z.string(),
});
