import { devotionImages } from '@/core/database/schema';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { defaultRefine } from '../utils/refine';

export const DevotionImageSchema = createSelectSchema(devotionImages, defaultRefine);

export const CreateDevotionImageSchema = createInsertSchema(devotionImages, defaultRefine).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateDevotionImageSchema = CreateDevotionImageSchema.partial().omit({
  devotionId: true,
});
