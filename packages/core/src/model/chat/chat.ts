import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';
import { chats } from '../../database/schema';

export type Chat = typeof chats.$inferSelect;

export const createChatSchema = createInsertSchema(chats, {
  id: z.undefined(),
  createdAt: z.undefined(),
  updatedAt: z.undefined(),
  name: z
    .string()
    .min(1)
    .max(255)
    .nullish()
    .transform((val) => val || 'New Chat'),
  customName: z.boolean().optional(),
  userId: z.string().uuid()
});
export type CreateChatData = z.input<typeof createChatSchema>;

export const updateChatSchema = createInsertSchema(chats, {
  id: z.undefined(),
  createdAt: z.undefined(),
  updatedAt: z.undefined(),
  name: z
    .string()
    .min(1)
    .max(255)
    .nullish()
    .transform((val) => val || undefined),
  customName: z.boolean().optional(),
  userId: z.undefined()
});
export type UpdateChatData = z.input<typeof updateChatSchema>;
