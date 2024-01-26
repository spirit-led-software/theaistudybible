import { RunnableSequence } from '@langchain/core/runnables';
import envConfig from '@revelationsai/core/configs/env';
import type { Document } from 'langchain/document';
import { JsonMarkdownStructuredOutputParser, OutputFixingParser } from 'langchain/output_parsers';
import { PromptTemplate } from 'langchain/prompts';
import { z } from 'zod';
import { getLargeContextModel } from '../../services/llm';
import { OUTPUT_FIXER_PROMPT_TEMPLATE } from '../../services/llm/prompts';
import { getDocumentVectorStore } from '../../services/vector-db';
import {
  USER_GENERATED_IMAGE_PROMPT_CHAIN_PROMPT_TEMPLATE,
  USER_GENERATED_IMAGE_PROMPT_VALIDATOR_PROMPT_TEMPLATE
} from './prompts';

const validationOutputParser = OutputFixingParser.fromLLM(
  getLargeContextModel({
    promptSuffix: '<output>',
    stopSequences: ['</output>'],
    temperature: 0.1,
    topK: 5,
    topP: 0.1
  }),
  JsonMarkdownStructuredOutputParser.fromZodSchema(
    z
      .object({
        inappropriate: z
          .boolean()
          .describe('A boolean value that indicates whether the prompt is inappropriate.')
      })
      .describe('The output of the validation prompt.')
  ),
  {
    prompt: PromptTemplate.fromTemplate(OUTPUT_FIXER_PROMPT_TEMPLATE)
  }
);

const phraseOutputParser = OutputFixingParser.fromLLM(
  getLargeContextModel({
    promptSuffix: '<output>',
    stopSequences: ['</output>'],
    temperature: 0.1,
    topK: 5,
    topP: 0.1
  }),
  JsonMarkdownStructuredOutputParser.fromZodSchema(
    z
      .array(
        z
          .string()
          .describe(
            'A short, concise, yet descriptive phrase that will help generate a biblically accurate image.'
          )
      )
      .length(4)
      .describe(
        'An array of exactly four (4) phrases that will help generate a biblically accurate image.'
      )
  ),
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
        .pipe(
          getLargeContextModel({
            stopSequences: ['</output>'],
            promptSuffix: '<output>'
          })
        )
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
        numPhrases: (4).toString(),
        formatInstructions: phraseOutputParser.getFormatInstructions()
      }
    })
      .pipe(
        getLargeContextModel({
          maxTokens: 2048,
          stopSequences: ['</output>'],
          promptSuffix: '<output>'
        })
      )
      .pipe(phraseOutputParser)
  ]);

  return chain;
};
