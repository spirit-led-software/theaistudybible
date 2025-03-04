import { defaultChatModel } from '@/ai/models';
import { registry } from '@/ai/provider-registry';
import { getValidMessages } from '@/ai/utils/get-valid-messages';
import { messagesToString } from '@/ai/utils/messages-to-string';
import { db } from '@/core/database';
import { createId } from '@/core/utils/id';
import { getPosthog } from '@/core/utils/posthog';
import type { Bindings, Variables } from '@/www/server/api/types';
import { getChatSuggestionsRateLimit } from '@/www/server/api/utils/chat';
import { zValidator } from '@hono/zod-validator';
import { Output, smoothStream, streamText } from 'ai';
import { formatDate } from 'date-fns';
import { Hono } from 'hono';
import { stream } from 'hono/streaming';
import { getRequestEvent } from 'solid-js/web';
import { z } from 'zod';
import { chatSuggestionsSchema } from '../../schemas/chat-suggestions';

const app = new Hono<{
  Bindings: Bindings;
  Variables: Variables;
}>()
  .use('/*', async (c, next) => {
    if (!c.var.user?.id) {
      return c.json({ message: 'You must be logged in to access this resource.' }, 401);
    }
    await next();
  })
  .post('/', zValidator('json', z.object({ chatId: z.string().nullish() })), async (c) => {
    const input = c.req.valid('json');

    const ratelimit = await getChatSuggestionsRateLimit(c.var.user!, c.var.roles);
    const ratelimitResult = await ratelimit.limit(c.var.user!.id);
    if (!ratelimitResult.success) {
      return c.json(
        {
          message: `You have exceeded your daily chat suggestions limit. Upgrade to pro or try again at ${formatDate(ratelimitResult.reset, 'M/d/yy h:mm a')}.`,
        },
        429,
      );
    }

    const chatId = input.chatId ?? createId();
    console.time('getChat');
    const chat = await db.query.chats.findFirst({
      where: (chats, { eq }) => eq(chats.id, chatId),
    });
    if (chat) {
      if (chat.userId !== c.var.user!.id) {
        return c.json({ message: 'You are not authorized to access this chat' }, 403);
      }
    } else {
      return c.json({ message: 'Chat not found' }, 404);
    }
    console.timeEnd('getChat');

    getPosthog()?.capture({
      distinctId: c.var.user!.id,
      event: 'chat suggestions requested',
      properties: { chatId },
    });

    const messages = await getValidMessages({
      chatId,
      userId: c.var.user!.id,
      maxTokens: defaultChatModel.contextSize,
    });

    const result = streamText({
      model: registry.languageModel(`${defaultChatModel.host}:${defaultChatModel.id}`),
      experimental_output: Output.object({ schema: chatSuggestionsSchema }),
      system: `You must generate a list of follow up questions that the user may ask a chatbot that is an expert on Christian faith and theology, given the messages provided. 
    
    These questions must drive the conversation forward and be thought-provoking.`,
      prompt: `Here's the conversation (delimited by triple dashes):
    ---
    ${messagesToString(messages)}
    ---
    
    What are some follow up questions that the user may ask?`,
      abortSignal: getRequestEvent()?.request.signal,
      experimental_transform: smoothStream(),
    });

    return stream(c, (stream) => stream.pipe(result.textStream));
  });

export default app;
