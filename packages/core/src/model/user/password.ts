import type { PgInsertValue, PgUpdateSetSource } from 'drizzle-orm/pg-core';
import type { userPasswords } from '../../database/schema';

export type UserPassword = typeof userPasswords.$inferSelect;

export type CreateUserPasswordData = PgInsertValue<typeof userPasswords>;

export type UpdateUserPasswordData = PgUpdateSetSource<typeof userPasswords>;
