import { websiteConfig } from "@core/configs";
import { NeonVectorStoreDocument } from "@core/langchain/vectorstores/neon";
import { Chat, UserMessage } from "@core/model";
import { aiResponsesToSourceDocuments } from "@core/schema";
import { readWriteDatabase } from "@lib/database";
import middy from "@middy/core";
import httpCors from "@middy/http-cors";
import {
  createAiResponse,
  getAiResponsesByUserMessageId,
  updateAiResponse,
} from "@services/ai-response";
import { createChat, getChat, updateChat } from "@services/chat";
import { getRAIChatChain } from "@services/llm";
import { validSessionFromEvent } from "@services/session";
import { isObjectOwner } from "@services/user";
import {
  createUserMessage,
  getUserMessagesByChatIdAndText,
} from "@services/user/message";
import { incrementUserQueryCount } from "@services/user/query-count";
import { LangChainStream, Message } from "ai";
import { APIGatewayProxyEventV2 } from "aws-lambda";
import { CallbackManager } from "langchain/callbacks";
import { Readable } from "stream";

const lambdaHandler = async (
  event: APIGatewayProxyEventV2
): Promise<any | void> => {
  console.log(`Received Chat Request Event: ${JSON.stringify(event)}`);
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
    } else {
      promises.push(incrementUserQueryCount(userInfo.id));
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
        await Promise.all([
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
                return;
              }
              console.log(`Pushing value: ${JSON.stringify(value)}`);
              this.push(value);
              this.read();
            })
            .catch(async (err) => {
              console.error(`${err.stack}`);
              await Promise.all(promises); // make sure everything is done before closing the stream
              this.push(null);
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

export const handler = middy({ streamifyResponse: true })
  .use(
    httpCors({
      origin: websiteConfig.url,
      methods: ["POST", "OPTIONS"].join(","),
      credentials: true,
      headers: ["authorization", "content-type"].join(","),
      requestHeaders: ["authorization", "content-type"].join(","),
      exposeHeaders: [
        "x-chat-id",
        "x-user-message-id",
        "x-ai-response-id",
        "content-type",
      ].join(","),
      disableBeforePreflightResponse: false,
    })
  )
  .handler(lambdaHandler);
