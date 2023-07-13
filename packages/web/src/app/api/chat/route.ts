import { prisma } from "@/services/database";
import {
  BadRequestResponse,
  InternalServerErrorResponse,
  ObjectNotFoundResponse,
  UnauthorizedResponse,
} from "@lib/api-responses";
import { Chat, Prisma } from "@prisma/client";
import { createAiResponse, updateAiResponse } from "@services/ai-responses";
import { createChat, getChat } from "@services/chat";
import { chatModel, model } from "@services/llm";
import { isObjectOwner, validServerSession } from "@services/user";
import { createUserMessage } from "@services/user-messages";
import { getVectorStore } from "@services/vector-db";
import { LangChainStream, Message, StreamingTextResponse } from "ai";
import { CallbackManager } from "langchain/callbacks";
import { ConversationalRetrievalQAChain } from "langchain/chains";
import { BufferMemory, ChatMessageHistory } from "langchain/memory";
import {
  AIChatMessage,
  BaseChatMessage,
  HumanChatMessage,
  SystemChatMessage,
} from "langchain/schema";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest): Promise<Response> {
  const { messages, chatId }: { messages: Message[]; chatId: string } =
    await request.json();

  try {
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== "user") {
      return BadRequestResponse("Invalid message");
    }

    const { isValid, user } = await validServerSession();
    if (!isValid) {
      return UnauthorizedResponse("You must be logged in");
    }

    let chat: Chat | null;
    if (!chatId) {
      chat = await createChat({
        name: messages[0].content,
        user: {
          connect: {
            id: user!.id,
          },
        },
      });
    } else {
      chat = await getChat(chatId);

      if (!chat) {
        return ObjectNotFoundResponse(chatId);
      }

      if (!isObjectOwner(chat, user)) {
        return UnauthorizedResponse("You do not own this chat");
      }
    }

    if (chat.name === "New Chat") {
      await prisma.chat.update({
        where: {
          id: chat.id,
        },
        data: {
          name: messages[0].content,
        },
      });
    }

    const userMessage = await createUserMessage({
      aiId: lastMessage.id,
      createdAt: lastMessage.createdAt,
      text: lastMessage.content,
      chat: {
        connect: {
          id: chat.id,
        },
      },
      user: {
        connect: {
          id: user.id,
        },
      },
    });

    const aiResponse = await createAiResponse({
      chat: {
        connect: {
          id: chat.id,
        },
      },
      userMessage: {
        connect: {
          id: userMessage.id,
        },
      },
      user: {
        connect: {
          id: user.id,
        },
      },
    });

    const vectorStore = await getVectorStore();
    const history: BaseChatMessage[] = messages.map((message) => {
      return message.role === "user"
        ? new HumanChatMessage(message.content)
        : new AIChatMessage(message.content);
    });
    history.unshift(
      new SystemChatMessage(
        "You are a Christian chatbot who can answer questions about Christian faith and theology. Answer questions from the perspective of a non-denominational believer. Do not deviate from the topic of faith. Quote the bible as much as possible in your answers. If you are asked what your name is, it is ChatESV."
      )
    );
    console.debug(`Chat history: ${JSON.stringify(history)}`);

    const memory = new BufferMemory({
      chatHistory: new ChatMessageHistory(history),
      memoryKey: "chat_history",
      inputKey: "message",
      outputKey: "answer",
      returnMessages: true,
    });
    const chain = ConversationalRetrievalQAChain.fromLLM(
      chatModel,
      vectorStore.asRetriever(),
      {
        returnSourceDocuments: true,
        memory,
        inputKey: "message",
        outputKey: "answer",
        questionGeneratorChainOptions: {
          llm: model,
        },
      }
    );
    const { stream, handlers } = LangChainStream();
    chain
      .call(
        {
          message: lastMessage.content,
        },
        CallbackManager.fromHandlers(handlers)
      )
      .then(async (result) => {
        await updateAiResponse(aiResponse.id, {
          text: result.text,
          sourceDocuments: {
            connectOrCreate: result.sourceDocuments.map(
              (sourceDocument: {
                pageContent: string;
                metadata: any;
              }): Prisma.SourceDocumentCreateOrConnectWithoutDevotionsInput => {
                return {
                  where: {
                    text: sourceDocument.pageContent,
                  },
                  create: {
                    text: sourceDocument.pageContent,
                    metadata: sourceDocument.metadata,
                  },
                };
              }
            ),
          },
        });
      })
      .catch(async (err) => {
        console.error(`${err.stack}`);
        await updateAiResponse(aiResponse.id, {
          failed: true,
        });
      });

    return new StreamingTextResponse(stream, {
      headers: {
        "x-chat-id": chat.id,
        "x-user-message-id": userMessage.id,
        "x-ai-response-id": aiResponse.id,
      },
    });
  } catch (error: any) {
    console.error(error);
    return InternalServerErrorResponse(error.stack);
  }
}
