import { envConfig } from "@core/configs";
import { getLargeContextModel } from "@services/llm";
import { getDocumentVectorStore } from "@services/vector-db";
import type { Document } from "langchain/document";
import { StructuredOutputParser } from "langchain/output_parsers";
import { PromptTemplate } from "langchain/prompts";
import { RunnableSequence } from "langchain/schema/runnable";
import { z } from "zod";
import {
  USER_GENERATED_IMAGE_PROMPT_CHAIN_PROMPT_TEMPLATE,
  USER_GENERATED_IMAGE_PROMPT_VALIDATOR_PROMPT_TEMPLATE,
} from "./prompts";

const validationOutputParser = StructuredOutputParser.fromZodSchema(
  z
    .object({
      inappropriate: z
        .boolean()
        .describe(
          "A boolean value that indicates whether the prompt is inappropriate."
        ),
    })
    .describe("The output of the validation prompt.")
);

const numPhrases = 4;
const phraseOutputParser = StructuredOutputParser.fromZodSchema(
  z
    .array(
      z
        .string()
        .describe(
          "A short, concise, yet descriptive phrase that will help generate a biblically accurate image."
        )
    )
    .length(numPhrases)
    .describe(
      "A list of exactly four (4) phrases that will help generate a biblically accurate image."
    )
);

export const getImagePromptChain = async () => {
  const retriever = await getDocumentVectorStore({
    filters: [
      {
        category: "bible",
      },
    ],
    verbose: envConfig.isLocal,
  }).then((store) =>
    store.asRetriever({
      k: 10,
      verbose: envConfig.isLocal,
    })
  );
  const chain = RunnableSequence.from([
    {
      userPrompt: (input) => input.userPrompt,
      validation: PromptTemplate.fromTemplate(
        USER_GENERATED_IMAGE_PROMPT_VALIDATOR_PROMPT_TEMPLATE,
        {
          partialVariables: {
            formatInstructions: validationOutputParser.getFormatInstructions(),
          },
        }
      )
        .pipe(
          getLargeContextModel({
            stopSequences: ["</output>"],
            promptSuffix: "<output>",
          })
        )
        .pipe(validationOutputParser),
    },
    {
      validation: (previousStepResult) => {
        if (previousStepResult.validation.inappropriate) {
          throw new Error("The prompt that was provided is inappropriate.");
        }
      },
      userPrompt: (previousStepResult) => previousStepResult.userPrompt,
    },
    {
      sourceDocuments: RunnableSequence.from([
        (input) => input.userPrompt,
        retriever,
      ]),
      userPrompt: (input) => input.userPrompt,
    },
    {
      documents: (previousStepResult) =>
        previousStepResult.sourceDocuments
          .map((d: Document) => `<document>\n${d.pageContent}\n</document>`)
          .join("\n"),
      userPrompt: (previousStepResult) => previousStepResult.userPrompt,
    },
    new PromptTemplate({
      template: USER_GENERATED_IMAGE_PROMPT_CHAIN_PROMPT_TEMPLATE,
      inputVariables: ["userPrompt", "documents"],
      partialVariables: {
        numPhrases: numPhrases.toString(),
        formatInstructions: phraseOutputParser.getFormatInstructions(),
      },
    })
      .pipe(
        getLargeContextModel({
          maxTokens: 2048,
          stopSequences: ["</output>"],
          promptSuffix: "<output>",
        })
      )
      .pipe(phraseOutputParser),
  ]);

  return chain;
};
