import { chats, sourceDocuments } from "@chatesv/core/database/schema";
import { createAiResponse, updateAiResponse } from "@core/services/ai-response";
import { createChat, getChat, updateChat } from "@core/services/chat";
import { getChatModel, getCompletionsModel } from "@core/services/llm";
import {
  createSourceDocument,
  getSourceDocumentByText,
} from "@core/services/source-doc";
import { isObjectOwner } from "@core/services/user";
import { createUserMessage } from "@core/services/user-message";
import { getVectorStore } from "@core/services/vector-db";
import {
  BadRequestResponse,
  InternalServerErrorResponse,
  ObjectNotFoundResponse,
  UnauthorizedResponse,
} from "@lib/api-responses";
import { validServerSession } from "@services/user";
import { LangChainStream, Message, StreamingTextResponse } from "ai";
import { InferModel } from "drizzle-orm";
import { CallbackManager } from "langchain/callbacks";
import { ConversationalRetrievalQAChain } from "langchain/chains";
import { BufferMemory, ChatMessageHistory } from "langchain/memory";
import {
  AIMessage,
  BaseMessage,
  HumanMessage,
  SystemMessage,
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

    const { isValid, userId } = await validServerSession();
    if (!isValid) {
      return UnauthorizedResponse("You must be logged in");
    }

    let chat: InferModel<typeof chats, "select"> | undefined;
    if (!chatId) {
      chat = await createChat({
        name: messages[0].content,
        userId: userId,
      });
    } else {
      chat = await getChat(chatId);

      if (!chat) {
        return ObjectNotFoundResponse(chatId);
      }

      if (!isObjectOwner(chat, userId)) {
        return UnauthorizedResponse("You do not own this chat");
      }
    }

    if (chat.name === "New Chat") {
      await updateChat(chat.id, {
        name: messages[0].content,
      });
    }

    const userMessage = await createUserMessage({
      aiId: lastMessage.id,
      createdAt:
        lastMessage.createdAt?.toISOString() ?? new Date().toISOString(),
      text: lastMessage.content,
      chatId: chat.id,
      userId: userId,
    });

    const aiResponse = await createAiResponse({
      chatId: chat.id,
      userMessageId: userMessage.id,
      userId: userId,
    });

    const vectorStore = await getVectorStore();
    const history: BaseMessage[] = messages.map((message) => {
      return message.role === "user"
        ? new HumanMessage(message.content)
        : new AIMessage(message.content);
    });
    history.unshift(
      new SystemMessage(
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
      getChatModel(),
      vectorStore.asRetriever(),
      {
        returnSourceDocuments: true,
        memory,
        inputKey: "message",
        outputKey: "answer",
        questionGeneratorChainOptions: {
          llm: getCompletionsModel(),
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
        });

        result.sourceDocuments.forEach(
          async (sd: { pageContent: string; metadata: any }) => {
            let sourceDocument:
              | InferModel<typeof sourceDocuments, "insert">
              | undefined;
            const existingSourceDoc = await getSourceDocumentByText(
              sd.pageContent
            );

            if (existingSourceDoc) {
              sourceDocument = existingSourceDoc;
            } else {
              sourceDocument = await createSourceDocument({
                text: sd.pageContent,
                metadata: sd.metadata,
              });
            }
          }
        );
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
