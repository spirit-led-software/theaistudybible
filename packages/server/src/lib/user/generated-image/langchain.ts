import { RunnableSequence } from '@langchain/core/runnables';
import envConfig from '@revelationsai/core/configs/env';
import type { Document } from 'langchain/document';
import { JsonMarkdownStructuredOutputParser, OutputFixingParser } from 'langchain/output_parsers';
import { PromptTemplate } from 'langchain/prompts';
import { z } from 'zod';
import { getLanguageModel } from '../../llm';
import { OUTPUT_FIXER_PROMPT_TEMPLATE } from '../../llm/prompts';
import { getDocumentVectorStore } from '../../vector-db';
import {
  USER_GENERATED_IMAGE_PROMPT_CHAIN_PROMPT_TEMPLATE,
  USER_GENERATED_IMAGE_PROMPT_VALIDATOR_PROMPT_TEMPLATE
} from './prompts';

const validationOutputParser = OutputFixingParser.fromLLM(
  getLanguageModel({
    temperature: 0.1,
    topK: 5,
    topP: 0.1
  }),
  JsonMarkdownStructuredOutputParser.fromZodSchema(
    z.object({
      inappropriate: z.boolean()
    })
  ),
  {
    prompt: PromptTemplate.fromTemplate(OUTPUT_FIXER_PROMPT_TEMPLATE)
  }
);

const phraseOutputParser = OutputFixingParser.fromLLM(
  getLanguageModel({
    temperature: 0.1,
    topK: 5,
    topP: 0.1
  }),
  JsonMarkdownStructuredOutputParser.fromZodSchema(z.array(z.string())),
  {
    prompt: PromptTemplate.fromTemplate(OUTPUT_FIXER_PROMPT_TEMPLATE)
  }
);

export const getImagePromptChain = async () => {
  const retriever = await getDocumentVectorStore({
    filters: [
      {
        category: 'bible'
      },
      {
        category: 'commentary'
      }
    ],
    verbose: envConfig.isLocal
  }).then((store) =>
    store.asRetriever({
      k: 20,
      verbose: envConfig.isLocal
    })
  );
  const chain = RunnableSequence.from([
    {
      userPrompt: (input) => input.userPrompt,
      validation: new PromptTemplate({
        template: USER_GENERATED_IMAGE_PROMPT_VALIDATOR_PROMPT_TEMPLATE,
        inputVariables: ['userPrompt'],
        partialVariables: {
          formatInstructions: validationOutputParser.getFormatInstructions()
        }
      })
        .pipe(getLanguageModel())
        .pipe(validationOutputParser)
    },
    {
      validation: (previousStepResult) => {
        if (previousStepResult.validation.inappropriate) {
          throw new Error('The prompt that was provided is inappropriate.');
        }
      },
      userPrompt: (previousStepResult) => previousStepResult.userPrompt
    },
    {
      sourceDocuments: RunnableSequence.from([(input) => input.userPrompt, retriever]),
      userPrompt: (input) => input.userPrompt
    },
    {
      documents: (previousStepResult) =>
        previousStepResult.sourceDocuments
          .map((d: Document) => `<document>\n${d.pageContent}\n</document>`)
          .join('\n'),
      userPrompt: (previousStepResult) => previousStepResult.userPrompt
    },
    new PromptTemplate({
      template: USER_GENERATED_IMAGE_PROMPT_CHAIN_PROMPT_TEMPLATE,
      inputVariables: ['userPrompt', 'documents'],
      partialVariables: {
        formatInstructions: phraseOutputParser.getFormatInstructions()
      }
    })
      .pipe(getLanguageModel())
      .pipe(phraseOutputParser)
  ]);

  return chain;
};
