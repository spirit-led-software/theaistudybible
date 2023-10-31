import { envConfig } from "@core/configs";
import type { NeonVectorStoreDocument } from "@core/langchain/vectorstores/neon";
import type { Chat } from "@core/model";
import { aiResponsesToSourceDocuments } from "@core/schema";
import { readWriteDatabase } from "@lib/database";
import middy from "@middy/core";
import {
  createAiResponse,
  getAiResponse,
  getAiResponsesByUserMessageId,
  updateAiResponse,
} from "@services/ai-response";
import { aiRenameChat, createChat, getChat } from "@services/chat";
import { getRAIChatChain } from "@services/chat/langchain";
import { validSessionFromEvent } from "@services/session";
import { incrementUserQueryCount, isObjectOwner } from "@services/user";
import {
  createUserMessage,
  getUserMessagesByChatIdAndText,
  updateUserMessage,
} from "@services/user/message";
import { getChatMemoryVectorStore } from "@services/vector-db";
import { LangChainStream, type Message } from "ai";
import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
} from "aws-lambda";
import { CallbackManager } from "langchain/callbacks";
import { Readable } from "stream";
import uuid from "uuid";

type StreamedAPIGatewayProxyStructuredResultV2 = Omit<
  APIGatewayProxyStructuredResultV2,
  "body"
> & {
  body: Readable;
};

const validateRequest = (
  event: APIGatewayProxyEventV2
): StreamedAPIGatewayProxyStructuredResultV2 | undefined => {
  // Handle CORS preflight request
  if (event.requestContext.http.method === "OPTIONS") {
    return {
      statusCode: 204,
      headers: {
        "Content-Type": "application/json",
      },
      body: Readable.from([JSON.stringify({})]),
    };
  }

  // Reject non-POST requests
  if (event.requestContext.http.method !== "POST") {
    console.log("Invalid method");
    return {
      statusCode: 405,
      headers: {
        "Content-Type": "application/json",
      },
      body: Readable.from([
        JSON.stringify({ error: "Invalid method, must be POST" }),
      ]),
    };
  }

  return undefined;
};

const lambdaHandler = async (
  event: APIGatewayProxyEventV2
): Promise<StreamedAPIGatewayProxyStructuredResultV2> => {
  console.log(`Received Chat Request Event: ${JSON.stringify(event)}`);

  const validationResponse = validateRequest(event);
  if (validationResponse) {
    return validationResponse;
  }

  const pendingPromises: Promise<any>[] = []; // promises to wait for before closing the stream

  if (!event.body) {
    console.log("Missing body");
    return {
      statusCode: 400,
      headers: {
        "Content-Type": "application/json",
      },
      body: Readable.from([JSON.stringify({ error: "Missing body" })]),
    };
  }

  const { messages = [], chatId }: { messages: Message[]; chatId?: string } =
    JSON.parse(event.body);

  try {
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== "user") {
      console.log("Invalid last message");
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
        },
        body: Readable.from([
          JSON.stringify({ error: "Invalid last message" }),
        ]),
      };
    }

    console.time("Validating session token");
    const { isValid, userInfo } = await validSessionFromEvent(event);
    if (!isValid) {
      console.log("Invalid session token");
      return {
        statusCode: 401,
        headers: {
          "Content-Type": "application/json",
        },
        body: Readable.from([
          JSON.stringify({ error: "Invalid session token" }),
        ]),
      };
    }
    console.timeEnd("Validating session token");

    if (userInfo.remainingQueries <= 0) {
      console.log(`Max daily query count of ${userInfo.maxQueries} reached`);
      return {
        statusCode: 429,
        headers: {
          "Content-Type": "application/json",
        },
        body: Readable.from([
          JSON.stringify({
            error: `Max daily query count of ${userInfo.maxQueries} reached`,
          }),
        ]),
      };
    }

    console.time("Validating chat");

    const newChatId = chatId ?? uuid.v4();
    let chat = await getChat(newChatId).then(async (foundChat) => {
      if (!foundChat) {
        return await Promise.all([
          createChat({
            id: newChatId,
            userId: userInfo.id,
          }),
          getChatMemoryVectorStore(newChatId, {
            verbose: envConfig.isLocal,
          }).then(async (store) => {
            await store.ensureTableInDatabase();
            return store;
          }),
        ]).then(([newChat]) => newChat);
      } else if (!isObjectOwner(foundChat, userInfo.id)) {
        return await createChat({
          userId: userInfo.id,
        });
      }
      return foundChat;
    });
    console.timeEnd("Validating chat");

    if (!chat.customName) {
      pendingPromises.push(aiRenameChat(chat.id, messages));
    }

    const userMessageId = uuid.v4();
    const aiResponseId = uuid.v4();
    const { stream, handlers } = LangChainStream();
    const { chain, memory } = await getRAIChatChain(chat.id, messages);
    const inputs = {
      query: lastMessage.content,
    };
    const langChainResponsePromise = chain
      .withConfig({
        callbacks: CallbackManager.fromHandlers(handlers),
      })
      .invoke(inputs)
      .then(async (result) => {
        console.log(`LangChain result: ${JSON.stringify(result)}`);
        const sourceDocuments =
          result.sourceDocuments?.filter((d1, i, arr) => {
            return arr.findIndex((d2) => d2.id === d1.id) === i;
          }) ?? [];
        await Promise.all([
          memory.saveContext(inputs, {
            output: result.text,
          }),
          postResponseValidationLogic({
            chat,
            userMessageId,
            aiResponseId,
            userId: userInfo.id,
            lastMessage,
            response: result.text,
            sourceDocuments,
          }),
        ]);
        return result;
      })
      .catch(async (err) => {
        console.error(`Error: ${err.stack}`);
        await getAiResponse(aiResponseId).then(async (aiResponse) => {
          if (aiResponse) {
            await updateAiResponse(aiResponse.id, {
              failed: true,
            });
          }
        });
        throw err;
      });
    pendingPromises.push(langChainResponsePromise);

    const reader = stream.getReader();
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "x-chat-id": chat.id,
        "x-user-message-id": userMessageId,
        "x-ai-response-id": aiResponseId,
      },
      body: new Readable({
        read() {
          reader
            .read()
            .then(async ({ done, value }: { done: boolean; value?: any }) => {
              if (done) {
                console.log("Finished chat stream response");
                await Promise.all(pendingPromises); // make sure everything is done before destroying the stream
                this.push(null);
                this.destroy();
                return;
              }
              if (value) {
                console.log(`Pushing ${typeof value}: ${value}`);
                this.push(value, "utf-8");
              }
              this.read();
            })
            .catch(async (err) => {
              console.error(`Error while streaming response: ${err}`);
              await Promise.all(pendingPromises); // make sure everything is done before destroying the stream
              this.push(null);
              this.destroy(err);
              throw err;
            });
        },
      }),
    };
  } catch (error: any) {
    console.error("Caught error:", error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
      },
      body: Readable.from([
        JSON.stringify({
          error: error.stack,
        }),
      ]),
    };
  }
};

const postResponseValidationLogic = async ({
  chat,
  userMessageId,
  aiResponseId,
  userId,
  lastMessage,
  response,
  sourceDocuments,
}: {
  chat: Chat;
  userMessageId: string;
  aiResponseId: string;
  userId: string;
  lastMessage: Message;
  response: string;
  sourceDocuments: NeonVectorStoreDocument[];
}): Promise<void> => {
  const userMessage = await getUserMessagesByChatIdAndText(
    chat.id,
    lastMessage.content
  ).then(async (userMessages) => {
    const userMessage = userMessages.at(0);
    if (userMessage) {
      return await updateUserMessage(userMessage.id, {
        id: userMessageId,
      });
    }
    return await createUserMessage({
      id: userMessageId,
      aiId: lastMessage.id,
      text: lastMessage.content,
      chatId: chat.id,
      userId: userId,
    });
  });

  await getAiResponsesByUserMessageId(userMessage.id).then(
    async (aiResponses) => {
      await Promise.all(
        aiResponses.map(async (aiResponse) => {
          await updateAiResponse(aiResponse.id, {
            regenerated: true,
          });
        })
      );
    }
  );

  const aiResponse = await createAiResponse({
    id: aiResponseId,
    chatId: chat.id,
    userMessageId: userMessage.id,
    userId,
    text: response,
  });

  await Promise.all([
    incrementUserQueryCount(userId),
    ...sourceDocuments.map(async (sourceDoc) => {
      if (sourceDoc.distance && sourceDoc.distance <= 0.7) {
        await readWriteDatabase.insert(aiResponsesToSourceDocuments).values({
          aiResponseId: aiResponse.id,
          sourceDocumentId: sourceDoc.id,
          distance: sourceDoc.distance,
          distanceMetric: sourceDoc.distanceMetric,
        });
      }
    }),
  ]);
};

export const handler = middy({ streamifyResponse: true }).handler(
  lambdaHandler
);
