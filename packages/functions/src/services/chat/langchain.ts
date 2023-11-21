import type { NeonVectorStoreDocument } from "@core/langchain/vectorstores";
import type { UserInfo } from "@core/model";
import type { Message } from "ai";
import type { Document } from "langchain/document";
import { ChatMessageHistory } from "langchain/memory";
import {
  RouterOutputParser,
  StructuredOutputParser,
} from "langchain/output_parsers";
import { PromptTemplate } from "langchain/prompts";
import { AIMessage, HumanMessage } from "langchain/schema";
import { StringOutputParser } from "langchain/schema/output_parser";
import {
  Runnable,
  RunnableBranch,
  RunnableSequence,
} from "langchain/schema/runnable";
import { z } from "zod";
import { getLargeContextModel, llmCache } from "../llm";
import { getDocumentVectorStore } from "../vector-db";
import {
  CHAT_BIBLE_QA_CHAIN_PROMPT_TEMPLATE,
  CHAT_BIBLE_QUOTE_CHAIN_PROMPT_TEMPLATE,
  CHAT_FAITH_QA_CHAIN_PROMPT_TEMPLATE,
  CHAT_HISTORY_CHAIN_PROMPT_TEMPLATE,
  CHAT_IDENTITY_CHAIN_PROMPT_TEMPLATE,
  CHAT_QUERY_INTERPRETER_PROMPT_TEMPLATE,
  CHAT_ROUTER_CHAIN_PROMPT_TEMPLATE,
  CHAT_SERMON_QA_CHAIN_PROMPT_TEMPLATE,
  CHAT_THEOLOGY_QA_CHAIN_PROMPT_TEMPLATE,
} from "./prompts";

export const getRAIChatChain = async (
  user: UserInfo,
  messages: Message[]
): Promise<
  Runnable<
    { query: string },
    {
      text: string;
      sourceDocuments?: NeonVectorStoreDocument[];
    }
  >
> => {
  const history = new ChatMessageHistory(
    messages.slice(0, -1).map((message) => {
      return message.role === "user"
        ? new HumanMessage(message.content)
        : new AIMessage(message.content);
    })
  );

  const identityChain = RunnableSequence.from([
    {
      query: (input) => input.routingInstructions.next_inputs.query,
    },
    {
      text: PromptTemplate.fromTemplate(CHAT_IDENTITY_CHAIN_PROMPT_TEMPLATE)
        .pipe(
          getLargeContextModel({
            stream: true,
            promptSuffix: "<answer>",
            stopSequences: ["</answer>"],
          })
        )
        .pipe(new StringOutputParser()),
    },
  ]);

  const chatHistoryChain = RunnableSequence.from([
    {
      query: (input) => input.routingInstructions.next_inputs.query,
      history: () =>
        messages
          ?.map(
            (message) =>
              `<message>\n<sender>${message.role}</sender><text>${message.content}</text>\n</message>`
          )
          .join("\n"),
    },
    {
      text: PromptTemplate.fromTemplate(CHAT_HISTORY_CHAIN_PROMPT_TEMPLATE)
        .pipe(
          getLargeContextModel({
            stream: true,
            promptSuffix: "<answer>",
            stopSequences: ["</answer>"],
          })
        )
        .pipe(new StringOutputParser()),
    },
  ]);

  const bibleQuoteChain = await getDocumentQaChain({
    prompt: CHAT_BIBLE_QUOTE_CHAIN_PROMPT_TEMPLATE,
    filters: [
      {
        category: "bible",
        translation: user.translation,
      },
    ],
  });

  const bibleQaChain = await getDocumentQaChain({
    prompt: CHAT_BIBLE_QA_CHAIN_PROMPT_TEMPLATE,
    filters: [
      {
        category: "bible",
        translation: user.translation,
      },
      {
        category: "commentary",
      },
    ],
  });

  const sermonQaChain = await getDocumentQaChain({
    prompt: CHAT_SERMON_QA_CHAIN_PROMPT_TEMPLATE,
    filters: [
      {
        category: "sermons",
      },
    ],
  });

  const theologyQaChain = await getDocumentQaChain({
    prompt: CHAT_THEOLOGY_QA_CHAIN_PROMPT_TEMPLATE,
    filters: [
      {
        category: "theology",
      },
    ],
  });

  const faithQaChain = await getDocumentQaChain({
    prompt: CHAT_FAITH_QA_CHAIN_PROMPT_TEMPLATE,
  });

  const branch = RunnableBranch.from([
    [(x) => x.routingInstructions.destination === "identity", identityChain],
    [
      (x) => x.routingInstructions.destination === "chat-history",
      chatHistoryChain,
    ],
    [
      (x) => x.routingInstructions.destination === "bible-quote",
      bibleQuoteChain,
    ],
    [(x) => x.routingInstructions.destination === "bible-qa", bibleQaChain],
    [(x) => x.routingInstructions.destination === "sermon-qa", sermonQaChain],
    [
      (x) => x.routingInstructions.destination === "theology-qa",
      theologyQaChain,
    ],
    [(x) => x.routingInstructions.destination === "faith-qa", faithQaChain],
    faithQaChain,
  ]);

  const routerChainOutputParser = new RouterOutputParser(
    z.object({
      destination: z
        .string()
        .optional()
        .describe(
          'The name of the question answering system to use. This can just be "DEFAULT" without the quotes if you do not know which system is best.'
        ),
      next_inputs: z
        .object({
          query: z
            .string()
            .describe("The query to be fed into the next model."),
        })
        .describe("The input to be fed into the next model."),
    })
  );
  const routerChain = RunnableSequence.from([
    new PromptTemplate({
      template: CHAT_ROUTER_CHAIN_PROMPT_TEMPLATE,
      inputVariables: ["query"],
      partialVariables: {
        formatInstructions: routerChainOutputParser.getFormatInstructions(),
        destinations: [
          "identity: Good for greetings, introducing yourself, or talking about yourself.",
          "chat-history: Good for retrieving information about the current chat conversation.",
          "bible-quote: Good for retrieving verses and passages from the Bible.",
          "bible-qa: Good for answering questions about the Bible, its interpretation, and its history.",
          "sermon-qa: Good for recommending and answering questions about sermons.",
          "theology-qa: Good for answering questions about Christian theology.",
          "faith-qa: Good for answering general questions about Christian faith.",
        ].join("\n"),
        history: (await history.getMessages())
          .map(
            (m) =>
              `<message>\n<sender>${m.name}</sender><text>${m.content}</text>\n</message>`
          )
          .join("\n"),
      },
    }),
    getLargeContextModel({
      maxTokens: 4096,
      promptSuffix: "<output>",
      stopSequences: ["</output>"],
      cache: llmCache,
    }),
    routerChainOutputParser,
  ]);

  const multiRouteChain = RunnableSequence.from([
    {
      routingInstructions: routerChain,
      input: (input) => input.query,
    },
    branch,
  ]);

  return multiRouteChain;
};

export async function getDocumentQaChain(options: {
  prompt: string;
  filters?: any[];
}) {
  const { prompt, filters } = options;
  const numSearchTerms = 3;
  const queryInterpreterOutputParser = StructuredOutputParser.fromZodSchema(
    z
      .array(z.string())
      .length(numSearchTerms)
      .describe(
        "Search terms or phrases that you would use to find relevant documents."
      )
  );
  const qaRetriever = await getDocumentVectorStore({
    filters,
    verbose: true,
  }).then((store) =>
    store.asRetriever({
      k: 7,
      verbose: true,
    })
  );
  const qaChain = RunnableSequence.from([
    {
      query: (input) => input.routingInstructions.next_inputs.query,
    },
    {
      generatedSearchQueries: PromptTemplate.fromTemplate(
        CHAT_QUERY_INTERPRETER_PROMPT_TEMPLATE,
        {
          partialVariables: {
            numSearchTerms: numSearchTerms.toString(),
            formatInstructions:
              queryInterpreterOutputParser.getFormatInstructions(),
          },
        }
      )
        .pipe(
          getLargeContextModel({
            stream: false,
            promptSuffix: "<output>",
            stopSequences: ["</output>"],
            cache: llmCache,
          })
        )
        .pipe(queryInterpreterOutputParser),
      query: (previousStepResult) => previousStepResult.query,
    },
    {
      sourceDocuments: async (previousStepResult): Promise<Document[]> => {
        const sourceDocs = await Promise.all(
          previousStepResult.generatedSearchQueries.map(async (q: string) => {
            return await qaRetriever.getRelevantDocuments(q);
          })
        );
        return sourceDocs.flat();
      },
      query: (previousStepResult) => previousStepResult.query,
    },
    {
      sourceDocuments: (previousStepResult) =>
        previousStepResult.sourceDocuments,
      query: (previousStepResult) => previousStepResult.query,
      documents: (previousStepResult) =>
        previousStepResult.sourceDocuments
          ?.map(
            (sourceDoc: Document) =>
              `<document>\n${sourceDoc.pageContent}\n</document>`
          )
          .join("\n"),
    },
    {
      text: PromptTemplate.fromTemplate(prompt)
        .pipe(
          getLargeContextModel({
            stream: true,
            promptSuffix: "<answer>",
            stopSequences: ["</answer>"],
          })
        )
        .pipe(new StringOutputParser()),
      sourceDocuments: (previousStepResult) =>
        previousStepResult.sourceDocuments,
    },
  ]);

  return qaChain;
}
