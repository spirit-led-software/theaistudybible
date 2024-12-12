import type { z } from 'zod';
import type { EmailBodySchema, EmailQueueRecordSchema } from '../schemas';

export type EmailBody = z.infer<typeof EmailBodySchema>;
export type EmailQueueRecord = z.infer<typeof EmailQueueRecordSchema>;
