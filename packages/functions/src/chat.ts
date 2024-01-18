import envConfig from '@core/configs/env';
import type { NeonVectorStoreDocument } from '@core/langchain/vectorstores/neon';
import type { Chat } from '@core/model/chat';
import { aiResponsesToSourceDocuments, userMessages } from '@core/schema';
import { readWriteDatabase } from '@lib/database';
import { aiRenameChat } from '@lib/util/chat';
import middy from '@middy/core';
import {
  createAiResponse,
  getAiResponse,
  getAiResponsesByUserMessageId,
  updateAiResponse
} from '@services/ai-response/ai-response';
import { createChat, getChat, updateChat, type RAIChatMessage } from '@services/chat';
import { getRAIChatChain } from '@services/chat/langchain';
import { validNonApiHandlerSession } from '@services/session';
import { isObjectOwner } from '@services/user';
import { createUserMessage, getUserMessages } from '@services/user/message';
import { decrementUserQueryCount, incrementUserQueryCount } from '@services/user/query-count';
import { LangChainStream } from 'ai';
import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { and, eq, or } from 'drizzle-orm';
import { CallbackManager } from 'langchain/callbacks';
import { Readable } from 'stream';
import { v4 as uuidV4 } from 'uuid';

type StreamedAPIGatewayProxyStructuredResultV2 = Omit<APIGatewayProxyStructuredResultV2, 'body'> & {
  body: Readable;
};

function validateRequest(
  event: APIGatewayProxyEventV2
): StreamedAPIGatewayProxyStructuredResultV2 | undefined {
  // Handle CORS preflight request
  if (event.requestContext.http.method === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Content-Type': 'application/json'
      },
      body: Readable.from([JSON.stringify({})])
    };
  }

  // Reject non-POST requests
  if (event.requestContext.http.method !== 'POST') {
    console.log('Invalid method');
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json'
      },
      body: Readable.from([JSON.stringify({ error: 'Invalid method, must be POST' })])
    };
  }

  return undefined;
}

async function postResponseValidationLogic({
  chat,
  userMessageId,
  aiResponseId,
  userId,
  response,
  sourceDocuments
}: {
  chat: Chat;
  userMessageId: string;
  aiResponseId: string;
  userId: string;
  lastMessage: RAIChatMessage;
  response: string;
  sourceDocuments: NeonVectorStoreDocument[];
}): Promise<void> {
  const aiResponse = await createAiResponse({
    id: aiResponseId,
    chatId: chat.id,
    userMessageId: userMessageId,
    userId,
    text: response
  });

  await Promise.all([
    ...sourceDocuments.map(async (sourceDoc) => {
      await readWriteDatabase.insert(aiResponsesToSourceDocuments).values({
        aiResponseId: aiResponse.id,
        sourceDocumentId: sourceDoc.id,
        distance: sourceDoc.distance,
        distanceMetric: sourceDoc.distanceMetric
      });
    })
  ]);
}

async function lambdaHandler(
  event: APIGatewayProxyEventV2
): Promise<StreamedAPIGatewayProxyStructuredResultV2> {
  console.log(`Received Chat Request Event: ${JSON.stringify(event)}`);

  const validationResponse = validateRequest(event);
  if (validationResponse) {
    return validationResponse;
  }

  const pendingPromises: Promise<unknown>[] = []; // promises to wait for before closing the stream

  if (!event.body) {
    console.log('Missing body');
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json'
      },
      body: Readable.from([JSON.stringify({ error: 'Missing body' })])
    };
  }

  const { messages = [], chatId }: { messages: RAIChatMessage[]; chatId?: string } = JSON.parse(
    event.body
  );

  try {
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== 'user') {
      console.log('Invalid last message');
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json'
        },
        body: Readable.from([JSON.stringify({ error: 'Invalid last message' })])
      };
    }

    console.time('Validating session token');
    const { isValid, userWithRoles, remainingQueries, maxQueries } =
      await validNonApiHandlerSession(event);
    if (!isValid) {
      console.log('Invalid session token');
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json'
        },
        body: Readable.from([JSON.stringify({ error: 'Invalid session token' })])
      };
    }
    console.timeEnd('Validating session token');

    if (remainingQueries <= 0) {
      console.log(`Max daily query count of ${maxQueries} reached`);
      return {
        statusCode: 429,
        headers: {
          'Content-Type': 'application/json'
        },
        body: Readable.from([
          JSON.stringify({
            error: `Max daily query count of ${maxQueries} reached`
          })
        ])
      };
    }
    const incrementQueryCountPromise = incrementUserQueryCount(userWithRoles.id);
    pendingPromises.push(incrementQueryCountPromise);

    console.time('Validating chat');
    const chat = chatId
      ? await getChat(chatId).then(async (foundChat) => {
          if (!foundChat || !isObjectOwner(foundChat, userWithRoles.id)) {
            return await createChat({
              userId: userWithRoles.id
            });
          }
          return foundChat;
        })
      : await createChat({
          userId: userWithRoles.id
        });

    console.timeEnd('Validating chat');

    if (!chat.customName) {
      pendingPromises.push(aiRenameChat(chat, messages));
    } else {
      pendingPromises.push(
        updateChat(chat.id, {
          updatedAt: new Date()
        })
      );
    }

    console.time('Validating user message');
    const userMessage = await getUserMessages({
      where: and(
        eq(userMessages.chatId, chat.id),
        lastMessage.uuid
          ? eq(userMessages.id, lastMessage.uuid)
          : or(eq(userMessages.text, lastMessage.content), eq(userMessages.aiId, lastMessage.id))
      )
    }).then(async (userMessages) => {
      const userMessage = userMessages.at(0);
      if (userMessage) {
        pendingPromises.push(
          getAiResponsesByUserMessageId(userMessage.id).then(async (aiResponses) => {
            await Promise.all(
              aiResponses.map(async (aiResponse) => {
                await updateAiResponse(aiResponse.id, {
                  regenerated: true
                });
              })
            );
          })
        );
        return userMessage;
      }
      return await createUserMessage({
        aiId: lastMessage.id,
        text: lastMessage.content,
        chatId: chat.id,
        userId: userWithRoles.id
      });
    });
    console.timeEnd('Validating user message');

    const aiResponseId = uuidV4();
    const { stream, handlers } = LangChainStream();
    const chain = await getRAIChatChain({
      modelId:
        maxQueries > 5 && !envConfig.isLocal
          ? 'anthropic.claude-v2:1'
          : 'anthropic.claude-instant-v1',
      user: userWithRoles,
      messages,
      callbacks: CallbackManager.fromHandlers(handlers)
    });
    const langChainResponsePromise = chain
      .invoke({
        query: lastMessage.content
      })
      .then(async (result) => {
        console.log(`LangChain result: ${JSON.stringify(result)}`);
        const sourceDocuments =
          result.sourceDocuments?.filter((d1, i, arr) => {
            return arr.findIndex((d2) => d2.id === d1.id) === i;
          }) ?? [];
        await postResponseValidationLogic({
          chat,
          userMessageId: userMessage.id,
          aiResponseId,
          userId: userWithRoles.id,
          lastMessage,
          response: result.text,
          sourceDocuments
        });
        return result;
      })
      .catch(async (err) => {
        console.error(`Error: ${err.stack}`);
        await Promise.all([
          incrementQueryCountPromise.then(() => {
            decrementUserQueryCount(userWithRoles.id);
          }),
          getAiResponse(aiResponseId).then(async (aiResponse) => {
            if (aiResponse) {
              await updateAiResponse(aiResponse.id, {
                failed: true
              });
            }
          })
        ]);
        throw err;
      });
    pendingPromises.push(langChainResponsePromise);

    const reader = stream.getReader();
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'x-chat-id': chat.id,
        'x-user-message-id': userMessage.id,
        'x-ai-response-id': aiResponseId
      },
      body: new Readable({
        read() {
          reader
            .read()
            .then(async ({ done, value }: { done: boolean; value?: unknown }) => {
              if (done) {
                console.log('Finished chat stream response');
                await Promise.all(pendingPromises); // make sure everything is done before destroying the stream
                this.push(null);
                this.destroy();
                return;
              }
              if (value) {
                console.log(`Pushing ${typeof value}: ${value}`);
                this.push(value, 'utf-8');
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
        }
      })
    };
  } catch (error) {
    console.error(`Caught error: ${JSON.stringify(error)}`);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: Readable.from([
        JSON.stringify({
          error:
            error instanceof Error
              ? `${error.message}: ${error.stack}`
              : `Error: ${JSON.stringify(error)}`
        })
      ])
    };
  }
}

export const handler = middy({ streamifyResponse: true }).handler(lambdaHandler);
