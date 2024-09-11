import { chats } from '@/core/database/schema';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const ChatSchema = createSelectSchema(chats);

export const CreateChatSchema = createInsertSchema(chats).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateChatSchema = CreateChatSchema.partial().omit({
  userId: true,
});
