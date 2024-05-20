import { BasePromptTemplate } from '@langchain/core/prompts';

export type PromptInfo = {
  /**
   * The prompt to use in the LLM
   */
  prompt: BasePromptTemplate;

  /**
   * Any necessary stop sequences to use when seeking the end of the response
   */
  stopSequences?: string[];
};
