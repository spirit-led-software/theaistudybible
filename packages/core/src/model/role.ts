import type { PgInsertValue, PgUpdateSetSource } from 'drizzle-orm/pg-core';
import type { roles } from '../database/schema';

export type Role = typeof roles.$inferSelect;

export type CreateRoleData = PgInsertValue<typeof roles>;

export type UpdateRoleData = PgUpdateSetSource<typeof roles>;
