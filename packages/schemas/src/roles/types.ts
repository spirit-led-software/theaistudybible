import type { z } from 'zod';
import type { CreateRoleSchema, RoleSchema, UpdateRoleSchema } from '.';

export type Role = z.infer<typeof RoleSchema>;
export type CreateRole = z.infer<typeof CreateRoleSchema>;
export type UpdateRole = z.infer<typeof UpdateRoleSchema>;
