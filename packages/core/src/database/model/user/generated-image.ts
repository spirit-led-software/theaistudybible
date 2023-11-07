import type { userGeneratedImages } from "../../schema";

export type UserGeneratedImage = typeof userGeneratedImages.$inferSelect;

export type CreateUserGeneratedImageData =
  typeof userGeneratedImages.$inferInsert;

export type UpdateUserGeneratedImageData =
  Partial<CreateUserGeneratedImageData>;
