import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { devotions } from "../schema";

export const createDevotionSchema = createInsertSchema(devotions);

export const updateDevotionSchema = createInsertSchema(devotions, {
  id: z.never(),
  createdAt: z.never(),
  updatedAt: z.never(),
});
