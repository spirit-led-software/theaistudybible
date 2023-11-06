import { getLargeContextModel } from "@services/llm";
import { getDocumentVectorStore } from "@services/vector-db";
import type { Document } from "langchain/document";
import { StructuredOutputParser } from "langchain/output_parsers";
import { PromptTemplate } from "langchain/prompts";
import { StringOutputParser } from "langchain/schema/output_parser";
import { RunnableSequence } from "langchain/schema/runnable";
import { z } from "zod";
import {
  USER_GENERATED_IMAGE_PROMPT_CHAIN_PROMPT_TEMPLATE,
  USER_GENERATED_IMAGE_PROMPT_VALIDATOR_PROMPT_TEMPLATE,
} from "./prompts";

export const getImagePromptChain = async () => {
  const imagePromptOutputParser = StructuredOutputParser.fromZodSchema(
    z.object({
      prompt: z
        .string()
        .describe(
          "The image generation prompt. Between 800 and 1000 characters in length."
        ),
      negativePrompt: z
        .string()
        .describe(
          "The negative image generation prompt. Between 800 and 1000 characters in length."
        ),
    })
  );

  const retriever = await getDocumentVectorStore().then((store) =>
    store.asRetriever(25)
  );
  const chain = RunnableSequence.from([
    {
      userPrompt: (input) => input.userPrompt,
      inappropriate: PromptTemplate.fromTemplate(
        USER_GENERATED_IMAGE_PROMPT_VALIDATOR_PROMPT_TEMPLATE
      )
        .pipe(
          getLargeContextModel({
            stopSequences: ["</output>"],
            promptSuffix: "<output>",
          })
        )
        .pipe(new StringOutputParser()),
    },
    {
      inappropriate: (previousStepResult) => {
        if (previousStepResult.inappropriate.trim() === "true") {
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
        formatInstructions: imagePromptOutputParser.getFormatInstructions(),
      },
    })
      .pipe(
        getLargeContextModel({
          maxTokens: 2048,
          stopSequences: ["</output>"],
          promptSuffix: "<output>",
        })
      )
      .pipe(imagePromptOutputParser),
  ]);

  return chain;
};
