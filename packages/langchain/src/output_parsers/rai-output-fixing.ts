import { BaseOutputParser } from '@langchain/core/output_parsers';
import { OutputFixingParser } from 'langchain/output_parsers';
import { getLanguageModel } from '../lib/llm';
import { OUTPUT_FIXER_PROMPT_TEMPLATE } from '../lib/prompts/general';

export class RAIOutputFixingParser<T> extends OutputFixingParser<T> {
  static lc_name(): string {
    return 'RAIOutputFixingParser';
  }

  static fromParser<T>(parser: BaseOutputParser<T>): RAIOutputFixingParser<T> {
    const { prompt, stopSequences } = OUTPUT_FIXER_PROMPT_TEMPLATE;
    return OutputFixingParser.fromLLM(
      getLanguageModel({
        temperature: 0.1,
        topK: 5,
        topP: 0.1,
        stopSequences
      }),
      parser,
      {
        prompt
      }
    );
  }
}
