import { userSettings } from '@/core/database/schema';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { defaultRefine } from '../../utils/refine';

export const UserSettingsSchema = createSelectSchema(userSettings, defaultRefine);

export const CreateUserSettingsSchema = createInsertSchema(userSettings, defaultRefine).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateUserSettingsSchema = CreateUserSettingsSchema.partial();
