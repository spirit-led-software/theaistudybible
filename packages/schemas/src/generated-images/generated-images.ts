import { userGeneratedImages } from '@/core/database/schema';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const UserGeneratedImageSchema = createSelectSchema(userGeneratedImages);

export const CreateUserGeneratedImageSchema = createInsertSchema(userGeneratedImages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateUserGeneratedImageSchema = CreateUserGeneratedImageSchema.partial().omit({
  messageId: true,
  userId: true,
});
