import { userCredits } from '@/core/database/schema';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { defaultRefine } from '../../utils/refine';

export const UserCreditsSchema = createSelectSchema(userCredits, defaultRefine);

export const CreateUserCreditsSchema = createInsertSchema(userCredits, defaultRefine).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateUserCreditsSchema = CreateUserCreditsSchema.partial();
