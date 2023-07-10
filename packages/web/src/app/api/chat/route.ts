import { prisma } from "@/services/database";
import { chatModel, model } from "@/services/llm";
import { getVectorStore } from "@/services/vector-db";
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
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest): Promise<Response> {
  const data = await request.json();

  const { messages, chatId }: { messages: Message[]; chatId: string } = data;

  if (!chatId) {
    return new Response(
      JSON.stringify({
        error: `Chat ID is required.`,
      }),
      {
        status: 400,
      }
    );
  }
  const chat = await prisma.chat.findUnique({
    where: {
      id: chatId,
    },
  });
  if (!chat) {
    return new Response(
      JSON.stringify({
        error: `Chat with ID ${chatId} not found.`,
      }),
      {
        status: 404,
      }
    );
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

  if (!lastMessage || lastMessage.role !== "user") {
    return new NextResponse(
      JSON.stringify({
        error: `No message provided.`,
      }),
      {
        status: 400,
      }
    );
  }

  const userMessage = await prisma.userMessage.create({
    data: {
      aiId: lastMessage.id,
      createdAt: lastMessage.createdAt,
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
      await prisma.aiResponse.create({
        data: {
          text: result.text,
          chatId: chat.id,
          userMessageId: userMessage.id,
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

  return new StreamingTextResponse(stream);
}
