import type { PgInsertValue, PgUpdateSetSource } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';
import { users } from '../../database/schema';
import type { Role } from '../role';

export type User = typeof users.$inferSelect;

export type CreateUserData = PgInsertValue<typeof users>;
export const createUserSchema = createInsertSchema(users, {
  id: z.undefined(),
  createdAt: z.undefined(),
  updatedAt: z.undefined(),
  email: z.string().email(),
  name: z.string().min(1).max(255).optional(),
  image: z.string().url().optional(),
  translation: z
    .enum(users.translation.enumValues)
    .nullable()
    .transform((val) => val || undefined),
  stripeCustomerId: z.string().nullish(),
  hasCustomImage: z.boolean().optional()
});
export type CreateUserInput = z.input<typeof createUserSchema>;

export type UpdateUserData = PgUpdateSetSource<typeof users>;
export const updateUserSchema = createInsertSchema(users, {
  id: z.undefined(),
  createdAt: z.undefined(),
  updatedAt: z.undefined(),
  email: z
    .string()
    .email()
    .nullish()
    .transform((val) => val || undefined),
  name: z.string().min(1).max(255).nullish(),
  image: z.string().url().nullish(),
  translation: z
    .enum(users.translation.enumValues)
    .nullish()
    .transform((val) => val || undefined),
  stripeCustomerId: z.string().nullish(),
  hasCustomImage: z.boolean().optional()
});
export type UpdateUserInput = z.input<typeof updateUserSchema>;

export type UserWithRoles = User & {
  roles: Role[];
};

export type UserInfo = UserWithRoles & {
  remainingQueries: number;
  maxQueries: number;
  maxGeneratedImages: number;
  remainingGeneratedImages: number;
};
