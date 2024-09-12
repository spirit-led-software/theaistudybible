import { userGeneratedImages } from '@/core/database/schema';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { defaultRefine } from '../utils/default-refine';

export const UserGeneratedImageSchema = createSelectSchema(userGeneratedImages, defaultRefine);

export const CreateUserGeneratedImageSchema = createInsertSchema(
  userGeneratedImages,
  defaultRefine,
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateUserGeneratedImageSchema = CreateUserGeneratedImageSchema.partial().omit({
  messageId: true,
  userId: true,
});
