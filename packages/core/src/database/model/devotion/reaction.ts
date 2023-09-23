import type { devotionReactions } from "../../schema";

export type DevotionReaction = typeof devotionReactions.$inferSelect;

export type CreateDevotionReactionData = typeof devotionReactions.$inferInsert;

export type UpdateDevotionReactionData = Partial<CreateDevotionReactionData>;
