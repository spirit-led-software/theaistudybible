import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { userMessages } from "../schema";

export const createUserMessageSchema = createInsertSchema(userMessages);

export const updateUserMessageSchema = createInsertSchema(userMessages, {
  id: z.never(),
  createdAt: z.never(),
  updatedAt: z.never(),
});
