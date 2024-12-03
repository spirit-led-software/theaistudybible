import { shareChatOptions } from '@/core/database/schema';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { defaultRefine } from '../utils/refine';

export const ShareChatOptionsSchema = createSelectSchema(shareChatOptions, defaultRefine);

export const CreateShareChatOptionsSchema = createInsertSchema(
  shareChatOptions,
  defaultRefine,
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateShareChatOptionsSchema = CreateShareChatOptionsSchema.partial();
