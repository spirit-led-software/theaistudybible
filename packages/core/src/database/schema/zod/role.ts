import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { roles } from "../schema";

export const createRoleSchema = createInsertSchema(roles);

export const updateRoleSchema = createInsertSchema(roles, {
  id: z.never(),
  createdAt: z.never(),
  updatedAt: z.never(),
});
