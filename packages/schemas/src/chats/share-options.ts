import { shareChatOptions } from '@/core/database/schema';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const ShareChatOptionsSchema = createSelectSchema(shareChatOptions);

export const CreateShareChatOptionsSchema = createInsertSchema(shareChatOptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateShareChatOptionsSchema = CreateShareChatOptionsSchema.partial();
