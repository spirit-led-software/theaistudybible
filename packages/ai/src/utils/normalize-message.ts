import type { Message as DbMessage } from '@/schemas/chats/messages/types';
import type { Message } from 'ai';

export const normalizeMessage = (message: DbMessage): Message => {
  return {
    ...message,
    reasoning: message.reasoning ?? undefined,
    annotations: message.annotations ?? undefined,
    toolInvocations: message.toolInvocations ?? undefined,
    experimental_attachments: message.experimental_attachments ?? undefined,
  };
};
