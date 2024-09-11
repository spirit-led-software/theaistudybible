import { roles } from '@/core/database/schema';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const RoleSchema = createSelectSchema(roles);

export const CreateRoleSchema = createInsertSchema(roles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateRoleSchema = CreateRoleSchema.partial();
