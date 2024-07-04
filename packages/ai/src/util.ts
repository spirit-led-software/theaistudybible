import { Message } from '@theaistudybible/core/model/chat/message';
import { toCapitalizedCase } from '@theaistudybible/core/util/string';
import { Tiktoken, getEncoding } from 'js-tiktoken';

export const cl100k_base = getEncoding('cl100k_base');

export const messagesToString = (messages: Pick<Message, 'role' | 'content'>[]) => {
  return messages.map((m) => `${toCapitalizedCase(m.role)}: ${m.content}`).join('\n');
};

export const numTokensFromString = (options: { encoding?: Tiktoken; text: string }) => {
  const encoding = options.encoding ?? cl100k_base;
  return encoding.encode(options.text).length;
};
