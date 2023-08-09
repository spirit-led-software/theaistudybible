import { InferModel } from "drizzle-orm";
import { PgUpdateSetSource } from "drizzle-orm/pg-core";
import { devotionImages } from "../schema";

export type DevotionImage = InferModel<typeof devotionImages, "select">;

export type CreateDevotionImageData = InferModel<
  typeof devotionImages,
  "insert"
>;

export type UpdateDevotionImageData = PgUpdateSetSource<typeof devotionImages>;
