import {
  createAiResponse,
  getAiResponsesByUserMessageId,
  updateAiResponse,
} from "@core/services/ai-response";
import { createChat, getChat, updateChat } from "@core/services/chat";
import { getChatModel, getPromptModel } from "@core/services/llm";
import { validSessionToken } from "@core/services/session";
import { isAdmin, isObjectOwner } from "@core/services/user";
import {
  createUserMessage,
  getUserMessagesByChatIdAndText,
} from "@core/services/user-message";
import {
  createUserDailyQueryCount,
  getUserDailyQueryCountByUserIdAndDate,
  updateUserDailyQueryCount,
} from "@core/services/user/daily-query-count";
import { getDocumentVectorStore } from "@core/services/vector-db";
import middy from "@middy/core";
import { readWriteDatabase } from "@revelationsai/core/database";
import {
  Chat,
  SourceDocument,
  UserMessage,
} from "@revelationsai/core/database/model";
import { aiResponsesToSourceDocuments } from "@revelationsai/core/database/schema";
import { LangChainStream, Message } from "ai";
import { APIGatewayProxyEventV2 } from "aws-lambda";
import { CallbackManager } from "langchain/callbacks";
import { ConversationalRetrievalQAChain } from "langchain/chains";
import { BufferMemory, ChatMessageHistory } from "langchain/memory";
import {
  AIMessage,
  BaseMessage,
  HumanMessage,
  SystemMessage,
} from "langchain/schema";
import { Readable } from "stream";

export const handler = middy({ streamifyResponse: true }).handler(
  async (event: APIGatewayProxyEventV2): Promise<any | void> => {
    console.log(`Received Chat Request Event: ${JSON.stringify(event)}`);

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

      const authorizationHeader = event.headers["authorization"];
      if (!authorizationHeader) {
        console.log("No auth header provided in request");
        return {
          statusCode: 401,
          headers: {
            "Content-Type": "application/json",
          },
          body: Readable.from([
            JSON.stringify({ error: "No auth header provided in request" }),
          ]),
        };
      }

      const { isValid, userInfo } = await validSessionToken(
        authorizationHeader.split(" ")[1]
      );
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

      const userDailyQueryCount = await getUserDailyQueryCountByUserIdAndDate(
        userInfo.id,
        new Date()
      );

      if (!userDailyQueryCount) {
        await createUserDailyQueryCount({
          userId: userInfo.id,
          count: 1,
        });
      } else if (
        userDailyQueryCount.count >= userInfo.maxDailyQueryCount &&
        !(await isAdmin(userInfo.id))
      ) {
        console.log(
          `Max daily query count of ${userInfo.maxDailyQueryCount} reached`
        );
        return {
          statusCode: 429,
          headers: {
            "Content-Type": "application/json",
          },
          body: Readable.from([
            JSON.stringify({
              error: `Max daily query count of ${userInfo.maxDailyQueryCount} reached`,
            }),
          ]),
        };
      } else {
        await updateUserDailyQueryCount(userDailyQueryCount.id, {
          count: userDailyQueryCount.count + 1,
        });
      }

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

      if (chat.name === "New Chat") {
        chat = await updateChat(chat.id, {
          name: messages[0].content,
        });
      }

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
        const oldAiResponse = (
          await getAiResponsesByUserMessageId(userMessage.id)
        )[0];
        if (oldAiResponse) {
          await updateAiResponse(oldAiResponse.id, {
            regenerated: true,
          });
        }
      }

      let aiResponse = await createAiResponse({
        chatId: chat.id,
        userMessageId: userMessage.id,
        userId: userInfo.id,
      });

      const vectorStore = await getDocumentVectorStore();
      const history: BaseMessage[] = messages.map((message) => {
        return message.role === "user"
          ? new HumanMessage(message.content)
          : new AIMessage(message.content);
      });
      history.unshift(
        new SystemMessage(
          "You are a Christian chatbot who can answer questions about Christian faith and theology. Answer questions from the perspective of a non-denominational believer. Do not deviate from the topic of faith. Quote the bible as much as possible in your answers. If you are asked what your name is, it is revelationsAI."
        )
      );
      console.debug(`Chat history: ${JSON.stringify(history)}`);

      const chain = ConversationalRetrievalQAChain.fromLLM(
        getChatModel(),
        vectorStore.asRetriever(3),
        {
          returnSourceDocuments: true,
          memory: new BufferMemory({
            chatHistory: new ChatMessageHistory(history),
            memoryKey: "chat_history",
            inputKey: "question",
            outputKey: "text",
            returnMessages: true,
          }),
          questionGeneratorChainOptions: {
            llm: getPromptModel(),
          },
        }
      );
      const { stream, handlers } = LangChainStream();
      chain
        .call(
          {
            question: lastMessage.content,
          },
          CallbackManager.fromHandlers(handlers)
        )
        .then(async (result) => {
          aiResponse = await updateAiResponse(aiResponse.id, {
            text: result.text,
          });

          await Promise.all(
            result.sourceDocuments.map(async (sourceDoc: SourceDocument) => {
              await readWriteDatabase
                .insert(aiResponsesToSourceDocuments)
                .values({
                  aiResponseId: aiResponse.id,
                  sourceDocumentId: sourceDoc.id,
                });
            })
          );
        })
        .catch(async (err) => {
          console.error(`${err.stack}`);
          await updateAiResponse(aiResponse.id, {
            failed: true,
          });
        });

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
              .then(({ done, value }: { done: boolean; value?: any }) => {
                if (done) {
                  console.log("Finished chat stream response");
                  this.push(null);
                  return;
                }
                this.push(value);
                this.read();
              })
              .catch((err) => {
                console.error(`${err.stack}`);
                this.push(null);
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
  }
);
