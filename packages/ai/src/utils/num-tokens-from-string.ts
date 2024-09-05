import type { Tiktoken } from 'js-tiktoken';
import { cl100k_base } from '../lib/encodings';

export const numTokensFromString = (options: { encoding?: Tiktoken; text: string }) => {
  const encoding = options.encoding ?? cl100k_base;
  return encoding.encode(options.text).length;
};
