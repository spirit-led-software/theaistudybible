import middy from '@middy/core';
import { aiResponsesToSourceDocuments, userMessages } from '@revelationsai/core/database/schema';
import type { UpstashVectorStoreDocument } from '@revelationsai/core/langchain/vectorstores/upstash';
import type { Chat } from '@revelationsai/core/model/chat';
import type { RAIChatMessage } from '@revelationsai/core/model/chat/message';
import {
  freeTierModelIds,
  plusTierModelIds,
  type FreeTierModelId,
  type PlusTierModelId
} from '@revelationsai/core/model/llm';
import { similarityFunctionMapping } from '@revelationsai/core/model/source-document';
import type { UserWithRoles } from '@revelationsai/core/model/user';
import { getTimeStringFromSeconds } from '@revelationsai/core/util/date';
import { aiRenameChat } from '@revelationsai/server/lib/chat';
import { getRAIChatChain } from '@revelationsai/server/lib/chat/langchain';
import { db } from '@revelationsai/server/lib/database';
import {
  createAiResponse,
  getAiResponse,
  getAiResponsesByUserMessageId,
  updateAiResponse
} from '@revelationsai/server/services/ai-response/ai-response';
import { createChat, getChat, updateChat } from '@revelationsai/server/services/chat';
import { validNonApiHandlerSession } from '@revelationsai/server/services/session';
import { hasPlusSync, isAdminSync, isObjectOwner } from '@revelationsai/server/services/user';
import { createUserMessage, getUserMessages } from '@revelationsai/server/services/user/message';
import {
  decrementUserQueryCount,
  getUserQueryCountTtl,
  incrementUserQueryCount
} from '@revelationsai/server/services/user/query-count';
import { LangChainStream } from 'ai';
import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { and, eq } from 'drizzle-orm';
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

function validateModelId(
  providedModelId: string,
  userWithRoles: UserWithRoles
): StreamedAPIGatewayProxyStructuredResultV2 | undefined {
  if (
    !freeTierModelIds.includes(providedModelId as FreeTierModelId) &&
    !plusTierModelIds.includes(providedModelId as PlusTierModelId)
  ) {
    console.log('Invalid modelId provided');
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json'
      },
      body: Readable.from([JSON.stringify({ error: 'Invalid model ID provided' })])
    };
  }
  if (
    plusTierModelIds.includes(providedModelId as PlusTierModelId) &&
    !hasPlusSync(userWithRoles) &&
    !isAdminSync(userWithRoles)
  ) {
    return {
      statusCode: 403,
      headers: {
        'Content-Type': 'application/json'
      },
      body: Readable.from([
        JSON.stringify({
          error: `Your plan does not support this model. Please upgrade to a plan that supports this model.`
        })
      ])
    };
  }
  return undefined;
}

function getDefaultModelId(userWithRoles: UserWithRoles): FreeTierModelId | PlusTierModelId {
  return hasPlusSync(userWithRoles) || isAdminSync(userWithRoles)
    ? ('claude-3-opus-20240229' satisfies PlusTierModelId)
    : ('claude-3-haiku-20240307' satisfies FreeTierModelId);
}

async function postResponseValidationLogic({
  modelId,
  chat,
  userMessageId,
  aiResponseId,
  userId,
  response,
  sourceDocuments,
  searchQueries
}: {
  modelId: FreeTierModelId | PlusTierModelId;
  chat: Chat;
  userMessageId: string;
  aiResponseId: string;
  userId: string;
  lastMessage: RAIChatMessage;
  response: string;
  sourceDocuments: UpstashVectorStoreDocument[];
  searchQueries: string[];
}): Promise<void> {
  const aiResponse = await createAiResponse({
    id: aiResponseId,
    chatId: chat.id,
    userMessageId: userMessageId,
    userId,
    text: response,
    modelId,
    searchQueries
  });

  await Promise.all(
    sourceDocuments.map(async (sourceDoc) => {
      await db.insert(aiResponsesToSourceDocuments).values({
        aiResponseId: aiResponse.id,
        sourceDocumentId: sourceDoc.id.toString(),
        distance: sourceDoc.score!,
        distanceMetric: similarityFunctionMapping[sourceDoc.similarityFunction!]
      });
    })
  );
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

  const {
    messages = [],
    chatId,
    modelId: providedModelId
  }: {
    messages: RAIChatMessage[];
    chatId?: string;
    modelId?: string;
  } = JSON.parse(event.body);

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
      await validNonApiHandlerSession(event.headers.authorization?.split(' ')[1]);
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
      const ttl = await getUserQueryCountTtl(userWithRoles.id);
      console.log(
        `Max query count of ${maxQueries} reached. Try again in ${getTimeStringFromSeconds(ttl)}.`
      );
      return {
        statusCode: 429,
        headers: {
          'Content-Type': 'application/json'
        },
        body: Readable.from([
          JSON.stringify({
            error: `You have issued too many requests. Please wait ${getTimeStringFromSeconds(
              ttl
            )} before trying again.`
          })
        ])
      };
    }
    const incrementQueryCountPromise = incrementUserQueryCount(userWithRoles.id);
    pendingPromises.push(incrementQueryCountPromise);

    if (providedModelId) {
      const modelIdValidationResponse = validateModelId(providedModelId, userWithRoles);
      if (modelIdValidationResponse) {
        return modelIdValidationResponse;
      }
    }
    const modelId = providedModelId ?? getDefaultModelId(userWithRoles);

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
    // Hacky way to update the chat updated_at field
    pendingPromises.push(updateChat(chat.id, { name: chat.name }));

    console.time('Validating user message');
    const userMessage = await getUserMessages({
      where: and(
        eq(userMessages.chatId, chat.id),
        lastMessage.uuid
          ? eq(userMessages.id, lastMessage.uuid)
          : and(eq(userMessages.text, lastMessage.content), eq(userMessages.aiId, lastMessage.id))
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

    const reader = stream.getReader();
    const bodyStream = new Readable({
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
              this.push(value, 'utf-8');
            }
            this.read();
          })
          .catch(async (err: unknown) => {
            console.error(`Error while streaming response: ${err}`);
            await Promise.all(pendingPromises); // make sure everything is done before destroying the stream

            if (err instanceof Error) {
              this.push(`Error: ${err.message}`);
              this.push(null);
              this.destroy(err);
            } else {
              this.push(`Error: ${JSON.stringify(err)}`);
              this.push(null);
              this.destroy(new Error(JSON.stringify(err)));
            }

            throw err;
          });
      }
    });

    console.time('Creating chat chain');
    const chain = await getRAIChatChain({
      modelId: modelId as FreeTierModelId | PlusTierModelId,
      user: userWithRoles,
      messages,
      callbacks: CallbackManager.fromHandlers(handlers)
    });
    console.timeEnd('Creating chat chain');
    console.log(`Chat chain: ${JSON.stringify(chain)}`);

    const langChainResponsePromise = chain
      .invoke({
        query: lastMessage.content
      })
      .then(async (result) => {
        console.log(`LangChain result: ${JSON.stringify(result)}`);
        const sourceDocuments = result.sourceDocuments ?? [];
        const searchQueries = result.searchQueries ?? [];
        await Promise.all([
          !chat.customName
            ? aiRenameChat(chat, [
                ...messages,
                {
                  id: uuidV4(),
                  role: 'assistant',
                  content: result.text
                }
              ])
            : Promise.resolve(),
          postResponseValidationLogic({
            modelId: modelId as FreeTierModelId | PlusTierModelId,
            chat,
            userMessageId: userMessage.id,
            aiResponseId,
            userId: userWithRoles.id,
            lastMessage,
            response: result.text,
            sourceDocuments,
            searchQueries
          })
        ]);
        return result;
      })
      .catch(async (err: unknown) => {
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
          }),
          ...pendingPromises
        ]);

        if (err instanceof Error) {
          console.error(`Error: ${err.message}\n\t${err.stack}`);
          bodyStream.push(`Error: ${err.message}`);
          bodyStream.push(null);
          bodyStream.destroy(err);
        } else {
          console.error(`Error: ${JSON.stringify(err)}`);
          bodyStream.push(`Error: ${JSON.stringify(err)}`);
          bodyStream.push(null);
          bodyStream.destroy(new Error(JSON.stringify(err)));
        }

        throw err;
      });
    pendingPromises.push(langChainResponsePromise);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'x-chat-id': chat.id,
        'x-user-message-id': userMessage.id,
        'x-ai-response-id': aiResponseId,
        'x-model-id': modelId
      },
      body: bodyStream
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
