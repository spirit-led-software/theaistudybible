import type { JwtPayload } from '@clerk/types';
import { CallbackManager } from '@langchain/core/callbacks/manager';
import middy from '@middy/core';
import { createId } from '@paralleldrive/cuid2';
import {
  chats,
  messages,
  messages as messagesTable,
  messagesToSourceDocuments
} from '@theaistudybible/core/database/schema';
import type { Chat } from '@theaistudybible/core/model/chat';
import type { Message } from '@theaistudybible/core/model/chat/message';
import {
  freeTierModelIds,
  plusTierModelIds,
  type FreeTierModelId,
  type PlusTierModelId
} from '@theaistudybible/core/model/llm';
import { similarityFunctionMapping } from '@theaistudybible/core/model/source-document';
import { getTimeStringFromSeconds } from '@theaistudybible/core/util/date';
import { getRAIChatChain } from '@theaistudybible/langchain/lib/chains/chat';
import type { UpstashVectorStoreDocument } from '@theaistudybible/langchain/vectorstores/upstash';
import { cache } from '@theaistudybible/server/lib/cache';
import { aiRenameChat } from '@theaistudybible/server/lib/chat';
import { db } from '@theaistudybible/server/lib/database';
import { getMaxQueryCountForUser, hasRole } from '@theaistudybible/server/lib/user';
import { Ratelimit } from '@upstash/ratelimit';
import { LangChainStream } from 'ai';
import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { and, eq } from 'drizzle-orm';
import { Readable } from 'stream';
import { getSessionClaimsFromEvent } from './lib/user';

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
  claims: JwtPayload
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
    !hasRole('rc:plus', claims) &&
    !hasRole('admin', claims)
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

function getDefaultModelId(claims: JwtPayload): FreeTierModelId | PlusTierModelId {
  return hasRole('rc:plus', claims) || hasRole('admin', claims)
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
  lastMessage: Message;
  response: string;
  sourceDocuments: UpstashVectorStoreDocument[];
  searchQueries: string[];
}): Promise<void> {
  const [aiResponse] = await db
    .insert(messages)
    .values({
      id: aiResponseId,
      chatId: chat.id,
      originMessageId: userMessageId,
      userId,
      role: 'assistant',
      content: response,
      metadata: {
        modelId,
        searchQueries
      }
    })
    .returning();

  await Promise.all(
    sourceDocuments.map(async (sourceDoc) => {
      await db.insert(messagesToSourceDocuments).values({
        messageId: aiResponse.id,
        sourceDocumentId: sourceDoc.id.toString(),
        distance: 1 - sourceDoc.score!,
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
    messages: Message[];
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

    const claims = await getSessionClaimsFromEvent(event);
    if (!claims) {
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

    const maxQueryCount = await getMaxQueryCountForUser(claims);
    const ratelimit = new Ratelimit({
      redis: cache,
      limiter: Ratelimit.slidingWindow(maxQueryCount, '3 h')
    });
    const ratelimitResult = await ratelimit.limit(claims.sub);
    if (!ratelimitResult.success) {
      console.log('Rate limit exceeded');
      return {
        statusCode: 429,
        headers: {
          'Content-Type': 'application/json'
        },
        body: Readable.from([
          JSON.stringify({
            error: `You have issued too many requests for your current plan. Please wait ${getTimeStringFromSeconds(
              ratelimitResult.remaining
            )} before trying again.`
          })
        ])
      };
    }

    if (providedModelId) {
      const modelIdValidationResponse = validateModelId(providedModelId, claims);
      if (modelIdValidationResponse) {
        return modelIdValidationResponse;
      }
    }
    const modelId = providedModelId ?? getDefaultModelId(claims);

    console.time('Validating chat');
    const [chat] = chatId
      ? await db.query.chats
          .findFirst({
            where: (chats, { eq }) => eq(chats.id, chatId)
          })
          .then(async (foundChat) => {
            if (!foundChat || foundChat.userId !== claims.sub) {
              return await db
                .insert(chats)
                .values({
                  userId: claims.sub
                })
                .returning();
            }
            return [foundChat];
          })
      : await db
          .insert(chats)
          .values({
            userId: claims.sub
          })
          .returning();

    console.timeEnd('Validating chat');
    // Hacky way to update the chat updated_at field
    pendingPromises.push(db.update(chats).set({ name: chat.name }).where(eq(chats.id, chat.id)));

    console.time('Validating user message');
    const [userMessage] = await db.query.messages
      .findMany({
        where: (messages, { and, eq }) =>
          and(eq(messages.chatId, chat.id), eq(messages.id, lastMessage.id))
      })
      .then(async (userMessages) => {
        const userMessage = userMessages.at(0);
        if (userMessage) {
          pendingPromises.push(
            db
              .update(messagesTable)
              .set({
                metadata: {
                  regenerated: true
                }
              })
              .where(
                and(
                  eq(messagesTable.originMessageId, userMessage.id),
                  eq(messagesTable.role, 'assistant')
                )
              )
          );
          return [userMessage];
        }
        return await db
          .insert(messagesTable)
          .values({
            chatId: chat.id,
            userId: claims.sub,
            role: 'user',
            content: lastMessage.content
          })
          .returning();
      });
    console.timeEnd('Validating user message');

    const aiResponseId = createId();
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
      claims,
      messages,
      callbacks: CallbackManager.fromHandlers(handlers)
    });
    console.timeEnd('Creating chat chain');
    console.log(`Chat chain: ${JSON.stringify(chain)}`);

    const langChainResponsePromise = chain
      .invoke({
        query: lastMessage.content!
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
                  id: aiResponseId,
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
            userId: claims.sub,
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
          ratelimit.resetUsedTokens(claims.sub),
          db.query.messages
            .findFirst({
              where: (messages, { eq }) => eq(messages.id, aiResponseId)
            })
            .then(async (aiResponse) => {
              if (aiResponse) {
                await db
                  .update(messagesTable)
                  .set({
                    metadata: { failed: true }
                  })
                  .where(eq(messagesTable.id, aiResponse.id));
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
