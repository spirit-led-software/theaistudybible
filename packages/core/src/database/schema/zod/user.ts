import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "../schema";

export const createUserSchema = createInsertSchema(users);

export const updateUserSchema = createInsertSchema(users, {
  id: z.never(),
  createdAt: z.never(),
  updatedAt: z.never(),
  email: z.string().email(),
});
