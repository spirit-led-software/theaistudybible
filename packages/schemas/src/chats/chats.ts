import { chats } from '@/core/database/schema';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { defaultRefine } from '../utils/default-refine';

export const ChatSchema = createSelectSchema(chats, defaultRefine);

export const CreateChatSchema = createInsertSchema(chats, defaultRefine).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateChatSchema = CreateChatSchema.partial().omit({
  userId: true,
});
