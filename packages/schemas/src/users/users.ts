import { users } from '@/core/database/schema';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { defaultRefine } from '../utils/default-refine';

export const UserSchema = createSelectSchema(users, defaultRefine);

export const CreateUserSchema = createInsertSchema(users, defaultRefine).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateUserSchema = CreateUserSchema.partial();
