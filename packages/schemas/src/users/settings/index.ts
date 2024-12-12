import { userSettings } from '@/core/database/schema';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { defaultRefine } from '../../utils/refine';

export const UserSettingSchema = createSelectSchema(userSettings, defaultRefine);

export const CreateUserSettingSchema = createInsertSchema(userSettings, defaultRefine).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateUserSettingSchema = CreateUserSettingSchema.partial();
