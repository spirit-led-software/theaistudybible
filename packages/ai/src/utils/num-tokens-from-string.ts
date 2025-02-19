import { encodingForModel, getEncoding } from '@langchain/core/utils/tiktoken';

export type TikToken = Awaited<ReturnType<typeof getEncoding>>;
export type TiktokenModel = Parameters<typeof encodingForModel>[0];

export const numTokensFromString = async (options: {
  model?: Parameters<typeof encodingForModel>[0];
  text: string;
}) => {
  let encoding: TikToken | undefined;
  if (options.model) {
    encoding = await encodingForModel(options.model);
  }

  if (!encoding) {
    encoding = await getEncoding('cl100k_base');
  }

  return encoding.encode(options.text).length;
};
