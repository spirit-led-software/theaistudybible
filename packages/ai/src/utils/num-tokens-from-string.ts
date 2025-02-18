import { Tiktoken } from 'tiktoken/lite';

export const numTokensFromString = async (options: { encoding?: Tiktoken; text: string }) => {
  const cl100k_base = await import('tiktoken/encoders/cl100k_base.json');
  const encoding =
    options.encoding ??
    new Tiktoken(cl100k_base.bpe_ranks, cl100k_base.special_tokens, cl100k_base.pat_str);
  const length = encoding.encode(options.text).length;
  encoding.free();
  return length;
};
