import { devotionImages } from '@/core/database/schema';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const DevotionImageSchema = createSelectSchema(devotionImages);

export const CreateDevotionImageSchema = createInsertSchema(devotionImages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateDevotionImageSchema = CreateDevotionImageSchema.partial().omit({
  devotionId: true,
});
