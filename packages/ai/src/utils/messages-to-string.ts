import { toCapitalizedCase } from '@/core/utils/string';
import type { Message } from '@/schemas/chats/messages/types';

export const messagesToString = (messages: Pick<Message, 'role' | 'content'>[]) => {
  return messages.map((m) => `${toCapitalizedCase(m.role)}: ${m.content}`).join('\n');
};
