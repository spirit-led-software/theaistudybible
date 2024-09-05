import type { z } from 'zod';
import type { CreateDevotionSchema, DevotionSchema, UpdateDevotionSchema } from './devotions';
import type {
  CreateDevotionImageSchema,
  DevotionImageSchema,
  UpdateDevotionImageSchema,
} from './images';
import type {
  CreateDevotionReactionSchema,
  DevotionReactionSchema,
  UpdateDevotionReactionSchema,
} from './reactions';

export type Devotion = z.infer<typeof DevotionSchema>;
export type CreateDevotion = z.infer<typeof CreateDevotionSchema>;
export type UpdateDevotion = z.infer<typeof UpdateDevotionSchema>;

export type DevotionImage = z.infer<typeof DevotionImageSchema>;
export type CreateDevotionImage = z.infer<typeof CreateDevotionImageSchema>;
export type UpdateDevotionImage = z.infer<typeof UpdateDevotionImageSchema>;

export type DevotionReaction = z.infer<typeof DevotionReactionSchema>;
export type CreateDevotionReaction = z.infer<typeof CreateDevotionReactionSchema>;
export type UpdateDevotionReaction = z.infer<typeof UpdateDevotionReactionSchema>;
