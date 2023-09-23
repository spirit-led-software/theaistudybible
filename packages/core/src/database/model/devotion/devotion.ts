import type { devotions } from "../../schema";

export type Devotion = typeof devotions.$inferSelect;

export type CreateDevotionData = typeof devotions.$inferInsert;

export type UpdateDevotionData = Partial<CreateDevotionData>;
