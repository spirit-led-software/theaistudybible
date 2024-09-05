import { messageReactions } from '@/core/database/schema';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const MessageReactionSchema = createSelectSchema(messageReactions);

export const CreateMessageReactionSchema = createInsertSchema(messageReactions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateMessageReactionSchema = CreateMessageReactionSchema.partial().omit({
  messageId: true,
  userId: true,
});
