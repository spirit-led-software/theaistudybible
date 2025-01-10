import type { z } from 'zod';
import type { CreateUserSchema, UpdateUserSchema, UserSchema } from '.';

export type User = z.infer<typeof UserSchema>;
export type CreateUser = z.infer<typeof CreateUserSchema>;
export type UpdateUser = z.infer<typeof UpdateUserSchema>;

export * from './settings/types';
export * from './credits/types';
export * from './sessions/types';
