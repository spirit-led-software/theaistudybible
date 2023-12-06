import type { PgInsertValue, PgUpdateSetSource } from 'drizzle-orm/pg-core';
import type { users } from '../../schema';
import type { Role } from '../role';

export type User = typeof users.$inferSelect;

export type CreateUserData = PgInsertValue<typeof users>;

export type UpdateUserData = PgUpdateSetSource<typeof users>;

export type UserWithRoles = User & {
  roles: Role[];
};

export type UserInfo = Omit<UserWithRoles, 'passwordHash'> & {
  remainingQueries: number;
  maxQueries: number;
  maxGeneratedImages: number;
  remainingGeneratedImages: number;
};
