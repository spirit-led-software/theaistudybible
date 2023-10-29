import { envConfig } from "@core/configs";
import type { NeonVectorStoreDocument } from "@core/langchain/vectorstores/neon";
import type { Chat, UserMessage } from "@core/model";
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
import { getRAIChatChain } from "@services/llm";
import { validSessionFromEvent } from "@services/session";
import { incrementUserQueryCount, isObjectOwner } from "@services/user";
import {
  createUserMessage,
  getUserMessagesByChatIdAndText,
} from "@services/user/message";
import { getChatMemoryVectorStore } from "@services/vector-db";
import { LangChainStream, type Message } from "ai";
import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
  Context,
} from "aws-lambda";
import { CallbackManager } from "langchain/callbacks";
import { Readable } from "stream";
import { v4 as uuidV4 } from "uuid";

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
  event: APIGatewayProxyEventV2,
  context: Context
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

    const newChatId = chatId ?? uuidV4();
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

    const userMessageId = uuidV4();
    const aiResponseId = uuidV4();
    const { stream, handlers } = LangChainStream();
    const chain = await getRAIChatChain(chat.id, messages);
    const langchainResponsePromise = chain
      .call(
        {
          input: lastMessage.content,
        },
        CallbackManager.fromHandlers(handlers)
      )
      .then(async (result) => {
        const sourceDocuments: NeonVectorStoreDocument[] =
          (
            result.sourceDocuments as NeonVectorStoreDocument[] | undefined
          )?.filter((d1, i, arr) => {
            return arr.findIndex((d2) => d2.id === d1.id) === i;
          }) ?? [];
        await postResponseValidationLogic({
          chat,
          userMessageId,
          aiResponseId,
          userInfo,
          lastMessage,
          response: result.text,
          sourceDocuments,
        });
        return result;
      })
      .catch(async (err) => {
        console.error(`${err.stack}`);
        if (await getAiResponse(aiResponseId)) {
          await updateAiResponse(aiResponseId, {
            failed: true,
          });
        }
        throw err;
      });
    pendingPromises.push(langchainResponsePromise);

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
                console.log(`Pushing value: ${JSON.stringify(value)}`);
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
  userInfo,
  lastMessage,
  response,
  sourceDocuments,
}: {
  chat: Chat;
  userMessageId: string;
  aiResponseId: string;
  userInfo: any;
  lastMessage: Message;
  response: string;
  sourceDocuments: NeonVectorStoreDocument[];
}): Promise<void> => {
  const pendingPromises: Promise<any>[] = [];

  console.time("Validating user message");
  let userMessage: UserMessage | undefined = (
    await getUserMessagesByChatIdAndText(chat.id, lastMessage.content)
  )[0];

  if (!userMessage) {
    userMessage = await createUserMessage({
      id: userMessageId,
      aiId: lastMessage.id,
      text: lastMessage.content,
      chatId: chat.id,
      userId: userInfo.id,
    });
  } else {
    pendingPromises.push(
      getAiResponsesByUserMessageId(userMessage.id).then(
        async (aiResponses) => {
          const oldAiResponse = aiResponses[0];
          if (oldAiResponse) {
            await updateAiResponse(oldAiResponse.id, {
              regenerated: true,
            });
          }
        }
      )
    );
  }
  console.timeEnd("Validating user message");

  let aiResponse = await createAiResponse({
    id: aiResponseId,
    chatId: chat.id,
    userMessageId: userMessage.id,
    userId: userInfo.id,
    text: response,
  });

  pendingPromises.push(
    incrementUserQueryCount(userInfo.id),
    ...sourceDocuments.map(async (sourceDoc) => {
      if (sourceDoc.distance && sourceDoc.distance <= 0.7) {
        await readWriteDatabase.insert(aiResponsesToSourceDocuments).values({
          aiResponseId: aiResponse.id,
          sourceDocumentId: sourceDoc.id,
          distance: sourceDoc.distance,
          distanceMetric: sourceDoc.distanceMetric,
        });
      }
    })
  );

  await Promise.all(pendingPromises);
};

export const handler = middy({ streamifyResponse: true }).handler(
  lambdaHandler
);
