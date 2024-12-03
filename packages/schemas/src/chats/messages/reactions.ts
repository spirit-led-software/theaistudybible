import { messageReactions } from '@/core/database/schema';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { defaultRefine } from '../../utils/refine';

export const MessageReactionSchema = createSelectSchema(messageReactions, defaultRefine);

export const CreateMessageReactionSchema = createInsertSchema(messageReactions, defaultRefine).omit(
  {
    id: true,
    createdAt: true,
    updatedAt: true,
  },
);

export const UpdateMessageReactionSchema = CreateMessageReactionSchema.partial().omit({
  messageId: true,
  userId: true,
});
