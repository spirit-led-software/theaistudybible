import {
  createAiResponse,
  getAiResponsesByUserMessageId,
  updateAiResponse,
} from "@core/services/ai-response";
import { createChat, getChat, updateChat } from "@core/services/chat";
import { getChatModel, getCompletionsModel } from "@core/services/llm";
import {
  createSourceDocument,
  getSourceDocumentByText,
} from "@core/services/source-doc";
import { isObjectOwner } from "@core/services/user";
import {
  createUserMessage,
  getUserMessagesByChatIdAndText,
} from "@core/services/user-message";
import { getVectorStore } from "@core/services/vector-db";
import {
  BadRequestResponse,
  InternalServerErrorResponse,
  ObjectNotFoundResponse,
  UnauthorizedResponse,
} from "@lib/api-responses";
import { db } from "@revelationsai/core/database";
import {
  Chat,
  SourceDocument,
  UserMessage,
} from "@revelationsai/core/database/model";
import { aiResponsesToSourceDocuments } from "@revelationsai/core/database/schema";
import { validServerSession } from "@services/user";
import { LangChainStream, Message, StreamingTextResponse } from "ai";
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

    const { isValid, userInfo } = await validServerSession();
    if (!isValid) {
      return UnauthorizedResponse("You must be logged in");
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
        return ObjectNotFoundResponse(chatId);
      }

      if (!isObjectOwner(chat, userInfo.id)) {
        return UnauthorizedResponse("You do not own this chat");
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

    const vectorStore = await getVectorStore();
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
      vectorStore.asRetriever(10),
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
          llm: getCompletionsModel(),
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

        result.sourceDocuments.forEach(
          async (sd: { pageContent: string; metadata: any }) => {
            let sourceDoc: SourceDocument | undefined;
            const existingSourceDoc = await getSourceDocumentByText(
              sd.pageContent
            );

            if (existingSourceDoc) {
              sourceDoc = existingSourceDoc;
            } else {
              sourceDoc = await createSourceDocument({
                text: sd.pageContent,
                metadata: sd.metadata,
              });
            }

            await db.insert(aiResponsesToSourceDocuments).values({
              aiResponseId: aiResponse.id,
              sourceDocumentId: sourceDoc.id,
            });
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
