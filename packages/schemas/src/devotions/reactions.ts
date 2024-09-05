import { devotionReactions } from '@/core/database/schema';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const DevotionReactionSchema = createSelectSchema(devotionReactions);

export const CreateDevotionReactionSchema = createInsertSchema(devotionReactions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateDevotionReactionSchema = CreateDevotionReactionSchema.partial().omit({
  devotionId: true,
  userId: true,
});
