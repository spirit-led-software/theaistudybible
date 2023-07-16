import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { chats } from "../schema";

export const createChatSchema = createInsertSchema(chats);

export const updateChatSchema = createInsertSchema(chats, {
  id: z.never(),
  createdAt: z.never(),
  updatedAt: z.never(),
  userId: z.never(),
});
