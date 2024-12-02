import { toCapitalizedCase } from '@/core/utils/string';
import type { Message } from '@/schemas/chats/messages/types';

export const messagesToString = (
  messages: Pick<Message, 'role' | 'content' | 'toolInvocations'>[],
) => {
  return messages
    .map(
      (m) =>
        `${toCapitalizedCase(m.role)}: ${m.content ?? ''}${
          m.toolInvocations?.length
            ? `\nTool Invocations: ${JSON.stringify(m.toolInvocations)}`
            : ''
        }`,
    )
    .join('\n\n');
};
