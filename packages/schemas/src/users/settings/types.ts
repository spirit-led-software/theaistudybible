import type { z } from 'zod';
import type { CreateUserSettingSchema, UpdateUserSettingSchema, UserSettingSchema } from '.';

export type UserSetting = z.infer<typeof UserSettingSchema>;
export type CreateUserSetting = z.infer<typeof CreateUserSettingSchema>;
export type UpdateUserSetting = z.infer<typeof UpdateUserSettingSchema>;
