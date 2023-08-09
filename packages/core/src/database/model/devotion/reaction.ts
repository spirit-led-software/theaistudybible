import { InferModel } from "drizzle-orm";
import { PgUpdateSetSource } from "drizzle-orm/pg-core";
import { devotionReactions } from "../../schema";

export type DevotionReaction = InferModel<typeof devotionReactions, "select">;

export type CreateDevotionReactionData = InferModel<
  typeof devotionReactions,
  "insert"
>;

export type UpdateDevotionReactionData = PgUpdateSetSource<
  typeof devotionReactions
>;
