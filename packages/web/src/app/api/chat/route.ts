import { prisma } from "@server/database";
import { chatModel, model } from "@server/llm";
import { getVectorStore } from "@server/vector-db";
import { Chat } from "@types";
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
  const data = await request.json();

  const { messages = [], chatId }: { messages: Message[]; chatId: string } =
    data;

  let chat: Chat;
  if (!chatId) {
    return new Response(
      JSON.stringify({
        error: `Chat ID is required.`,
      }),
      {
        status: 400,
      }
    );
  } else {
    const foundChat = await prisma.chat.findUnique({
      where: {
        id: chatId,
      },
    });
    if (!foundChat) {
      return new Response(
        JSON.stringify({
          error: `Chat with ID ${chatId} not found.`,
        }),
        {
          status: 404,
        }
      );
    }
    chat = foundChat;
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

  const lastMessage = messages[messages.length - 1];

  await prisma.chatMessage.create({
    data: {
      type: "user",
      text: lastMessage.content,
      chatId: chat.id,
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
    vectorStore.asRetriever(3),
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
      await prisma.chatMessage.create({
        data: {
          type: "bot",
          text: result.text,
          chatId: chatId,
          sourceDocuments: {
            create: result.sourceDocuments.map((doc: any) => ({
              sourceDocument: {
                connectOrCreate: {
                  where: {
                    text: doc.pageContent,
                  },
                  create: {
                    text: doc.pageContent,
                    metadata: doc.metadata,
                  },
                },
              },
            })),
          },
        },
      });
    })
    .catch((err) => {
      console.error(`${err.stack}`);
    });

  return new StreamingTextResponse(stream, {});
}
