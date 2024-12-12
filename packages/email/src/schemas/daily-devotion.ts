import { DevotionImageSchema, DevotionSchema } from '@/schemas/devotions';
import { z } from 'zod';

export const DailyDevotionEmailSchema = z.object({
  type: z.literal('daily-devotion'),
  devotion: DevotionSchema,
  devotionImage: DevotionImageSchema,
});
