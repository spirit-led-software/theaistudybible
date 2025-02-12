import type { z } from 'zod';
import type {
  CreateMessageSchema,
  MessagePartSchema,
  MessageSchema,
  ReasoningPartSchema,
  TextPartSchema,
  ToolInvocationPartSchema,
  UpdateMessageSchema,
} from '.';
import type {
  CreateMessageReactionSchema,
  MessageReactionSchema,
  UpdateMessageReactionSchema,
} from './reactions';

export type Message = z.infer<typeof MessageSchema>;
export type CreateMessage = z.infer<typeof CreateMessageSchema>;
export type UpdateMessage = z.infer<typeof UpdateMessageSchema>;

export type MessageReaction = z.infer<typeof MessageReactionSchema>;
export type CreateMessageReaction = z.infer<typeof CreateMessageReactionSchema>;
export type UpdateMessageReaction = z.infer<typeof UpdateMessageReactionSchema>;

export type MessagePart = z.infer<typeof MessagePartSchema>;
export type TextPart = z.infer<typeof TextPartSchema>;
export type ReasoningPart = z.infer<typeof ReasoningPartSchema>;
export type ToolInvocationPart = z.infer<typeof ToolInvocationPartSchema>;
