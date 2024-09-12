import { roles } from '@/core/database/schema';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { defaultRefine } from '../utils/default-refine';

export const RoleSchema = createSelectSchema(roles, defaultRefine);

export const CreateRoleSchema = createInsertSchema(roles, defaultRefine).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateRoleSchema = CreateRoleSchema.partial();
