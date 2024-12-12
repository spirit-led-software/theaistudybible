import { z } from 'zod';

export const DeadLetterEmailSchema = z.object({
  type: z.literal('dead-letter'),
  record: z.any(),
});
