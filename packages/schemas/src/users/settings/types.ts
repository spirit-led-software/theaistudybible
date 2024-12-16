import type { z } from 'zod';
import type { CreateUserSettingsSchema, UpdateUserSettingsSchema, UserSettingsSchema } from '.';

export type UserSettings = z.infer<typeof UserSettingsSchema>;
export type CreateUserSettings = z.infer<typeof CreateUserSettingsSchema>;
export type UpdateUserSettings = z.infer<typeof UpdateUserSettingsSchema>;
