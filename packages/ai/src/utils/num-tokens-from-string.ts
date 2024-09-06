import { get_encoding, type Tiktoken } from 'tiktoken';

export const cl100k_base = get_encoding('cl100k_base');

export const numTokensFromString = (options: { encoding?: Tiktoken; text: string }) => {
  const encoding = options.encoding ?? cl100k_base;
  return encoding.encode(options.text).length;
};
