import type { PgInsertValue, PgUpdateSetSource } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';
import { chats } from '../../database/schema';

export type Chat = typeof chats.$inferSelect;

export type CreateChatData = PgInsertValue<typeof chats>;
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
  userId: z
    .string()
    .uuid()
    .nullish()
    .transform((val) => val || undefined)
});
export type CreateChatInput = z.input<typeof createChatSchema>;

export type UpdateChatData = PgUpdateSetSource<typeof chats>;
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
export type UpdateChatInput = z.input<typeof updateChatSchema>;
