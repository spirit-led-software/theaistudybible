import type { PgInsertValue, PgUpdateSetSource } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';
import { roles } from '../database/schema';

export type Role = typeof roles.$inferSelect;

export type CreateRoleData = PgInsertValue<typeof roles>;
export const createRoleSchema = createInsertSchema(roles, {
  id: z.undefined(),
  createdAt: z.undefined(),
  updatedAt: z.undefined(),
  name: z
    .string()
    .regex(/[a-z:]+/g)
    .min(1)
    .max(30),
  permissions: z.array(z.string().min(1).max(30))
});
export type CreateRoleInput = z.input<typeof createRoleSchema>;

export type UpdateRoleData = PgUpdateSetSource<typeof roles>;
export const updateRoleSchema = createInsertSchema(roles, {
  id: z.undefined(),
  createdAt: z.undefined(),
  updatedAt: z.undefined(),
  name: z
    .string()
    .regex(/[a-z:]+/g)
    .min(1)
    .max(30)
    .nullish()
    .transform((val) => val || undefined),
  permissions: z
    .array(z.string().min(1).max(30))
    .nullish()
    .transform((val) => val || undefined)
});
export type UpdateRoleInput = z.input<typeof updateRoleSchema>;
