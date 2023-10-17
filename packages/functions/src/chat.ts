import type { NeonVectorStoreDocument } from "@core/langchain/vectorstores/neon";
import type { Chat, UserMessage } from "@core/model";
import { aiResponsesToSourceDocuments } from "@core/schema";
import { readWriteDatabase } from "@lib/database";
import middy from "@middy/core";
import {
  createAiResponse,
  getAiResponsesByUserMessageId,
  updateAiResponse,
} from "@services/ai-response";
import { createChat, getChat, updateChat } from "@services/chat";
import { getRAIChatChain } from "@services/llm";
import { validSessionFromEvent } from "@services/session";
import { incrementUserQueryCount, isObjectOwner } from "@services/user";
import {
  createUserMessage,
  getUserMessagesByChatIdAndText,
} from "@services/user/message";
import { LangChainStream, type Message } from "ai";
import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
  Context,
} from "aws-lambda";
import { CallbackManager } from "langchain/callbacks";
import { Readable } from "stream";

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

  const promises: Promise<any>[] = []; // promises to wait for before closing the stream

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

  const { messages, chatId }: { messages: Message[]; chatId: string } =
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
    let chat: Chat | undefined;
    if (!chatId) {
      chat = await createChat({
        name: messages[0].content,
        userId: userInfo.id,
      });
    } else {
      chat = await getChat(chatId);

      if (!chat) {
        console.log(`Chat ${chatId} not found`);
        return {
          statusCode: 404,
          headers: {
            "Content-Type": "application/json",
          },
          body: Readable.from([
            JSON.stringify({ error: `Chat ${chatId} not found` }),
          ]),
        };
      }

      if (!isObjectOwner(chat, userInfo.id)) {
        console.log("Unauthorized to access chat");
        return {
          statusCode: 403,
          headers: {
            "Content-Type": "application/json",
          },
          body: Readable.from([
            JSON.stringify({ error: "Unauthorized to access chat" }),
          ]),
        };
      }
    }
    console.timeEnd("Validating chat");

    if (chat.name === "New Chat") {
      promises.push(
        updateChat(chat.id, {
          name: messages[0].content,
        })
      );
    }

    console.time("Validating user message");
    let userMessage: UserMessage | undefined = (
      await getUserMessagesByChatIdAndText(chat.id, lastMessage.content)
    )[0];

    if (!userMessage) {
      userMessage = await createUserMessage({
        aiId: lastMessage.id,
        text: lastMessage.content,
        chatId: chat.id,
        userId: userInfo.id,
      });
    } else {
      promises.push(
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
      chatId: chat.id,
      userMessageId: userMessage.id,
      userId: userInfo.id,
    });

    const { stream, handlers } = LangChainStream();
    const chain = await getRAIChatChain(chat, messages);
    const langchainResponsePromise = chain
      .call(
        {
          input: lastMessage.content,
        },
        CallbackManager.fromHandlers(handlers)
      )
      .then(async (result) => {
        return await Promise.all([
          incrementUserQueryCount(userInfo.id),
          updateAiResponse(aiResponse.id, {
            text: result.text,
          }),
          ...(result.sourceDocuments?.map(
            async (sourceDoc: NeonVectorStoreDocument) => {
              await readWriteDatabase
                .insert(aiResponsesToSourceDocuments)
                .values({
                  aiResponseId: aiResponse.id,
                  sourceDocumentId: sourceDoc.id,
                });
            }
          ) ?? []),
        ]);
      })
      .catch(async (err) => {
        console.error(`${err.stack}`);
        await updateAiResponse(aiResponse.id, {
          failed: true,
        });
      });
    promises.push(langchainResponsePromise);

    const reader = stream.getReader();
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "x-chat-id": chat.id,
        "x-user-message-id": userMessage.id,
        "x-ai-response-id": aiResponse.id,
      },
      body: new Readable({
        read() {
          reader
            .read()
            .then(async ({ done, value }: { done: boolean; value?: any }) => {
              if (done) {
                console.log("Finished chat stream response");
                await Promise.all(promises); // make sure everything is done before closing the stream
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
              await Promise.all(promises); // make sure everything is done before closing the stream
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

export const handler = middy({ streamifyResponse: true }).handler(
  lambdaHandler
);
