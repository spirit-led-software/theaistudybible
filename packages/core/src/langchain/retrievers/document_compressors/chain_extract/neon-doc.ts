import type { BaseLanguageModel } from 'langchain/base_language';
import { LLMChain } from 'langchain/chains';
import { PromptTemplate } from 'langchain/prompts';
import { LLMChainExtractor } from 'langchain/retrievers/document_compressors/chain_extract';
import { BaseOutputParser } from 'langchain/schema/output_parser';
import { envConfig } from '../../../../configs';
import { NeonVectorStoreDocument } from '../../../vectorstores/neon';

export const PROMPT_TEMPLATE = (
  noOutputStr: string
) => `Given the following question and context, extract any part of the context *AS IS* that is relevant to answer the question. If none of the context is relevant return ${noOutputStr}.

Remember, *DO NOT* edit the extracted parts of the context.

> Question: {question}
> Context:
>>>
{context}
>>>
Extracted relevant parts:`;

function defaultGetInput(query: string, doc: NeonVectorStoreDocument) {
  return { question: query, context: doc.pageContent };
}

class NoOutputParser extends BaseOutputParser {
  readonly lc_namespace = ['langchain', 'retrievers', 'document_compressors', 'chain_extract'];
  readonly noOutputStr = 'NO_OUTPUT';

  constructor() {
    super();
  }

  parse(text: string) {
    const cleanedText = text.trim();
    if (cleanedText === this.noOutputStr) {
      return Promise.resolve('');
    }
    return Promise.resolve(cleanedText);
  }

  getFormatInstructions(): string {
    throw new Error('Method not implemented.');
  }
}

function getDefaultChainPrompt() {
  const outputParser = new NoOutputParser();
  const template = PROMPT_TEMPLATE(outputParser.noOutputStr);
  return new PromptTemplate({
    template,
    inputVariables: ['question', 'context'],
    outputParser
  });
}

export class NeonDocLLMChainExtractor extends LLMChainExtractor {
  async compressDocuments(
    documents: NeonVectorStoreDocument[],
    query: string
  ): Promise<NeonVectorStoreDocument[]> {
    const compressedDocs = await Promise.all(
      documents.map(async (doc) => {
        const input = this.getInput(query, doc);
        const output = await this.llmChain.predict(input);
        return output.length > 0
          ? new NeonVectorStoreDocument({
              id: doc.id,
              metadata: doc.metadata,
              pageContent: output,
              embedding: doc.embedding
            })
          : undefined;
      })
    );
    return compressedDocs.filter((doc): doc is NeonVectorStoreDocument => doc !== undefined);
  }

  static fromLLM(
    llm: BaseLanguageModel,
    prompt?: PromptTemplate,
    getInput?: (query: string, doc: NeonVectorStoreDocument) => Record<string, unknown>
  ) {
    const _prompt = prompt || getDefaultChainPrompt();
    const _getInput = getInput || defaultGetInput;
    const llmChain = new LLMChain({
      llm,
      prompt: _prompt,
      verbose: envConfig.isLocal
    });

    // @ts-expect-error NeonVectorStoreDocument is not recognized as valid
    return new NeonDocLLMChainExtractor({ llmChain, getInput: _getInput });
  }
}
