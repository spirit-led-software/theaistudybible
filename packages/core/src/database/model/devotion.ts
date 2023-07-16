import { InferModel } from "drizzle-orm";
import { PgUpdateSetSource } from "drizzle-orm/pg-core";
import { devotions } from "../schema";

export type Devotion = InferModel<typeof devotions, "select">;

export type CreateDevotionData = InferModel<typeof devotions, "insert">;

export type UpdateDevotionData = PgUpdateSetSource<typeof devotions>;
