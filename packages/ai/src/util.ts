import { Message } from '@theaistudybible/core/src/model/chat/message';
import { toCapitalizedCase } from '@theaistudybible/core/util/string';

export const messagesToString = (message: Pick<Message, 'role' | 'content'>[]) => {
  return message.map((m) => `${toCapitalizedCase(m.role)}: ${m.content}`).join('\n');
};
