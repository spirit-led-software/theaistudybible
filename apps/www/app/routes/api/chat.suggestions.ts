import { defaultChatModel } from '@/ai/models';
import { registry } from '@/ai/provider-registry';
import { getValidMessages } from '@/ai/utils/get-valid-messages';
import { messagesToString } from '@/ai/utils/messages-to-string';
import { db } from '@/core/database';
import { createId } from '@/core/utils/id';
import { getPosthog } from '@/core/utils/posthog';
import type { Role } from '@/schemas/roles/types';
import { chatSuggestionsSchema } from '@/www/schemas/chat-suggestions';
import { authenticate, getUserRolesAndSettings } from '@/www/server/utils/authenticate';
import { getChatSuggestionsRateLimit } from '@/www/server/utils/chat';
import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { getRequestIP } from '@tanstack/react-start/server';
import { Output, smoothStream, streamText } from 'ai';
import { formatDate } from 'date-fns';
import { z } from 'zod';

const chatSuggestionsApiSchema = z.object({
  chatId: z.string().nullish(),
});

export const APIRoute = createAPIFileRoute('/api/chat/suggestions')({
  POST: async ({ request }) => {
    const validationResult = chatSuggestionsApiSchema.safeParse(await request.json());
    if (!validationResult.success) {
      return json({ error: validationResult.error.message }, { status: 400 });
    }

    const { user } = await authenticate();
    let roles: Role[] | null = null;
    if (user) {
      ({ roles } = await getUserRolesAndSettings(user.id));
    }

    const ratelimit = await getChatSuggestionsRateLimit({ user, roles });
    const rateLimitKey = user?.id ?? getRequestIP({ xForwardedFor: true });
    if (!rateLimitKey) {
      return json({ message: 'We were unable to identify you.' }, { status: 401 });
    }

    const ratelimitResult = await ratelimit.limit(rateLimitKey);
    if (!ratelimitResult.success) {
      return json(
        {
          message: `You have exceeded your daily chat suggestions limit. Upgrade to pro or try again at ${formatDate(ratelimitResult.reset, 'M/d/yy h:mm a')}.`,
        },
        { status: 429 },
      );
    }

    const input = validationResult.data;
    const chatId = input.chatId ?? createId();
    console.time('getChat');
    const chat = await db.query.chats.findFirst({
      where: (chats, { eq }) => eq(chats.id, chatId),
    });
    if (chat) {
      if (chat.userId !== user?.id) {
        return json({ message: 'You are not authorized to access this chat' }, { status: 403 });
      }
    } else {
      return json({ message: 'Chat not found' }, { status: 404 });
    }
    console.timeEnd('getChat');

    getPosthog()?.capture({
      distinctId: rateLimitKey,
      event: 'chat suggestions requested',
      properties: { chatId },
    });

    const messages = await getValidMessages({
      chatId,
      userId: rateLimitKey,
      maxTokens: defaultChatModel.contextSize,
    });

    const result = streamText({
      // @ts-expect-error
      model: registry.languageModel(`${defaultChatModel.host}:${defaultChatModel.id}`),
      experimental_output: Output.object({ schema: chatSuggestionsSchema }),
      system: `You must generate a list of follow up questions that the user may ask a chatbot that is an expert on Christian faith and theology, given the messages provided. 
    
    These questions must drive the conversation forward and be thought-provoking.`,
      prompt: `Here's the conversation (delimited by triple dashes):
    ---
    ${messagesToString(messages)}
    ---
    
    What are some follow up questions that the user may ask?`,
      abortSignal: request.signal,
      experimental_transform: smoothStream(),
    });

    return result.toTextStreamResponse();
  },
});
