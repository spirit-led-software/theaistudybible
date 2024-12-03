import type { z } from 'zod';
import type { ChatSchema, CreateChatSchema, UpdateChatSchema } from '.';
import type {
  CreateShareChatOptionsSchema,
  ShareChatOptionsSchema,
  UpdateShareChatOptionsSchema,
} from './share-options';

export type Chat = z.infer<typeof ChatSchema>;
export type CreateChat = z.infer<typeof CreateChatSchema>;
export type UpdateChat = z.infer<typeof UpdateChatSchema>;

export type ShareChatOptions = z.infer<typeof ShareChatOptionsSchema>;
export type CreateShareChatOptions = z.infer<typeof CreateShareChatOptionsSchema>;
export type UpdateShareChatOptions = z.infer<typeof UpdateShareChatOptionsSchema>;

export * from './messages/types';
