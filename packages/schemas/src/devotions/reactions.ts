import { devotionReactions } from '@/core/database/schema';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { defaultRefine } from '../utils/default-refine';

export const DevotionReactionSchema = createSelectSchema(devotionReactions, defaultRefine);

export const CreateDevotionReactionSchema = createInsertSchema(
  devotionReactions,
  defaultRefine,
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateDevotionReactionSchema = CreateDevotionReactionSchema.partial().omit({
  devotionId: true,
  userId: true,
});
