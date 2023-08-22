import { userQueryCounts } from "../../schema";

export type UserQueryCount = typeof userQueryCounts.$inferSelect;

export type CreateUserQueryCountData = typeof userQueryCounts.$inferInsert;

export type UpdateUserQueryCountData = Partial<CreateUserQueryCountData>;
