import type { users } from "../../schema";
import type { Role } from "../role";

export type User = typeof users.$inferSelect;

export type CreateUserData = typeof users.$inferInsert;

export type UpdateUserData = Partial<CreateUserData>;

export type UserWithRoles = User & {
  roles: Role[];
};

export type UserInfo = UserWithRoles & {
  remainingQueries: number;
  maxQueries: number;
};
