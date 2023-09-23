import type { devotionImages } from "../../schema";

export type DevotionImage = typeof devotionImages.$inferSelect;

export type CreateDevotionImageData = typeof devotionImages.$inferInsert;

export type UpdateDevotionImageData = Partial<CreateDevotionImageData>;
