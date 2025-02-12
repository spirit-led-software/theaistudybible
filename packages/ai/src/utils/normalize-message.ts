import type { Message as DbMessage } from '@/schemas/chats/messages/types';
import type { Message } from 'ai';

export const normalizeMessage = (message: DbMessage): Message => {
  return {
    ...message,
    createdAt: message.createdAt ? new Date(message.createdAt) : undefined, // just in case it's a string
    reasoning: message.reasoning ?? undefined,
    annotations: message.annotations ?? undefined,
    toolInvocations: message.toolInvocations ?? undefined,
    experimental_attachments: message.experimental_attachments ?? undefined,
    parts: message.parts ?? undefined,
  };
};
