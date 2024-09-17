import type { z } from 'zod';
import type { EmailQueueRecordSchema } from './schemas';

export type EmailQueueRecord = z.infer<typeof EmailQueueRecordSchema>;
