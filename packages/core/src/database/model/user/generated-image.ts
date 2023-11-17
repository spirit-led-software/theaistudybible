import type { PgInsertValue, PgUpdateSetSource } from "drizzle-orm/pg-core";
import type { userGeneratedImages } from "../../schema";

export type UserGeneratedImage = typeof userGeneratedImages.$inferSelect;

export type CreateUserGeneratedImageData = PgInsertValue<
  typeof userGeneratedImages
>;

export type UpdateUserGeneratedImageData = PgUpdateSetSource<
  typeof userGeneratedImages
>;
