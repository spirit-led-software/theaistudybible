import { createChatChain } from '@/ai/chat';
import { allChatModels } from '@/ai/models';
import { basicChatModels } from '@/ai/models';
import { db } from '@/core/database';
import { chats, messages as messagesTable } from '@/core/database/schema';
import { getPosthog } from '@/core/utils/posthog';
import type { Bible } from '@/schemas/bibles/types';
import { MessageSchema } from '@/schemas/chats/messages';
import type { Role } from '@/schemas/roles/types';
import type { UserSettings } from '@/schemas/users/types';
import { authenticate, getUserRolesAndSettings } from '@/www/server/utils/authenticate';
import { getChatRateLimit, validateModelId } from '@/www/server/utils/chat';
import { getMessageId } from '@/www/utils/message';
import { createId } from '@paralleldrive/cuid2';
import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { getRequestIP } from '@tanstack/react-start/server';
import { createDataStreamResponse, smoothStream } from 'ai';
import { formatDate } from 'date-fns';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const chatApiSchema = z.object({
  messages: z.array(
    MessageSchema.partial()
      .required({
        id: true,
        role: true,
        content: true,
      })
      .passthrough(),
  ),
  chatId: z.string().nullish(),
  modelId: z.string().nullish(),
  bibleAbbreviation: z.string().nullish(),
  additionalContext: z.string().nullish(),
});

export const APIRoute = createAPIFileRoute('/api/chat')({
  GET: async ({ request }) => {
    const validationResult = chatApiSchema.safeParse(await request.json());
    if (!validationResult.success) {
      return json({ error: validationResult.error.message }, { status: 400 });
    }

    const { user } = await authenticate();
    let settings: UserSettings | null = null;
    let roles: Role[] | null = null;
    if (user) {
      ({ settings, roles } = await getUserRolesAndSettings(user.id));
    }

    const input = validationResult.data;
    const pendingPromises: Promise<unknown>[] = []; // promises to wait for before closing the stream

    console.time('validateModelId');
    if (input.modelId) {
      await validateModelId({
        user,
        roles,
        providedModelId: input.modelId,
      });
    }
    console.timeEnd('validateModelId');
    const modelId = input.modelId ?? `${basicChatModels[0].host}:${basicChatModels[0].id}`;

    const modelInfo = allChatModels.find((m) => m.id === modelId.split(':')[1]);
    if (!modelInfo) {
      return json({ message: 'Invalid model provided' }, { status: 400 });
    }

    const ratelimit = await getChatRateLimit({ user, roles });
    const rateLimitKey = user?.id ?? getRequestIP({ xForwardedFor: true });
    if (!rateLimitKey) {
      return json({ message: 'We were unable to identify you.' }, { status: 401 });
    }

    const ratelimitResult = await ratelimit.limit(rateLimitKey);
    if (!ratelimitResult.success) {
      return json(
        {
          message: `You have exceeded your daily chat limit. Upgrade to pro or try again at ${formatDate(ratelimitResult.reset, 'M/d/yy h:mm a')}.`,
        },
        { status: 429 },
      );
    }

    const chatId = input.chatId ?? createId();
    console.time('getChat');
    let chat = await db.query.chats.findFirst({
      where: (chats, { eq }) => eq(chats.id, chatId),
    });
    if (chat) {
      if (chat.userId !== user?.id) {
        return json({ message: 'You are not authorized to access this chat' }, { status: 403 });
      }
    } else {
      [chat] = await db
        .insert(chats)
        .values({
          id: chatId,
          userId: rateLimitKey,
        })
        .returning();
    }
    console.timeEnd('getChat');

    console.time('validateBibleId');
    let bible: Bible | undefined;
    if (input.bibleAbbreviation) {
      bible = await db.query.bibles.findFirst({
        where: (bibles, { eq }) => eq(bibles.abbreviation, input.bibleAbbreviation!),
      });
      if (!bible) return json({ message: 'Invalid Bible ID' }, { status: 400 });
    } else if (settings?.preferredBibleAbbreviation) {
      bible = await db.query.bibles.findFirst({
        where: (bibles, { eq }) => eq(bibles.abbreviation, settings!.preferredBibleAbbreviation!),
      });
    }
    console.timeEnd('validateBibleId');

    let lastMessage = input.messages.at(-1);
    if (!lastMessage) {
      return json({ message: 'You must provide at least one message' }, { status: 400 });
    }

    console.time('saveMessage');
    const lastMessageId = getMessageId(lastMessage);
    const existingMessage = await db.query.messages.findFirst({
      where: (messages, { eq }) => eq(messages.id, lastMessageId),
    });
    if (existingMessage) {
      if (existingMessage.userId !== user?.id || existingMessage.chatId !== chat.id) {
        return json({ message: 'You are not authorized to access this message' }, { status: 403 });
      }
      [lastMessage] = await db
        .update(messagesTable)
        .set({
          ...lastMessage,
          createdAt: lastMessage.createdAt ? new Date(lastMessage.createdAt) : undefined,
          updatedAt: new Date(),
        })
        .where(eq(messagesTable.id, existingMessage.id))
        .returning();
    } else {
      [lastMessage] = await db
        .insert(messagesTable)
        .values({
          ...lastMessage,
          updatedAt: new Date(),
          chatId: chat.id,
          userId: rateLimitKey,
        })
        .returning();
    }
    console.timeEnd('saveMessage');

    getPosthog()?.capture({
      distinctId: rateLimitKey,
      event: 'message sent',
      properties: { message: lastMessage },
    });

    let pingInterval: NodeJS.Timeout | undefined;
    return createDataStreamResponse({
      execute: async (dataStream) => {
        // Ping the stream every 200ms to avoid idle connection timeout
        pingInterval = setInterval(() => dataStream.writeData('ping'), 200);

        if (input.chatId !== chat.id) {
          dataStream.writeData({ chatId: chat.id });
        }

        const streamText = await createChatChain({
          chat,
          modelInfo,
          userId: rateLimitKey,
          user,
          roles,
          settings,
          dataStream: dataStream,
          additionalContext: input.additionalContext,
          bible,
          onStepFinish: (step) => {
            dataStream.writeMessageAnnotation({ modelId });
            getPosthog()?.capture({
              distinctId: rateLimitKey,
              event: 'message step finished',
              properties: { step },
            });
          },
          onFinish: async (event) => {
            clearInterval(pingInterval);
            if (event.finishReason !== 'stop' && event.finishReason !== 'tool-calls') {
              pendingPromises.push(
                ratelimit.resetUsedTokens(rateLimitKey).then(() =>
                  ratelimit.limit(rateLimitKey, {
                    rate: ratelimitResult.limit - ratelimitResult.remaining,
                  }),
                ),
              );
            }
            await Promise.all(pendingPromises);
            getPosthog()?.capture({
              distinctId: rateLimitKey,
              event: 'message event finished',
              properties: { event },
            });
          },
          abortSignal: request.signal,
          experimental_toolCallStreaming: true,
          experimental_transform: smoothStream(),
        });

        const result = streamText();
        result.mergeIntoDataStream(dataStream);
      },
      onError: (error) => {
        clearInterval(pingInterval);
        return error instanceof Error ? error.message : String(error);
      },
    });
  },
});
