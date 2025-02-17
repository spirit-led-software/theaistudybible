import { getEncoding } from '@langchain/core/utils/tiktoken';
import type { Tiktoken } from 'js-tiktoken/lite';

export const numTokensFromString = async (options: { encoding?: Tiktoken; text: string }) => {
  const encoding = options.encoding ?? (await getEncoding('cl100k_base'));
  return encoding.encode(options.text).length;
};
