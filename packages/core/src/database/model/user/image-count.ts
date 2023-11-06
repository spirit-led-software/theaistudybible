import type { userGeneratedImageCounts } from "../../schema";

export type UserGeneratedImageCount =
  typeof userGeneratedImageCounts.$inferSelect;

export type CreateUserGeneratedImageCountData =
  typeof userGeneratedImageCounts.$inferInsert;

export type UpdateUserGeneratedImageCountData =
  Partial<CreateUserGeneratedImageCountData>;
