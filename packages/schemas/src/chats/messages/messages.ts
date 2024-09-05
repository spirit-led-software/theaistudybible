import { messages } from '@/core/database/schema';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

export const ToolInvocationSchema = z
  .object({
    toolName: z.string().min(1),
    toolCallId: z.string().min(1),
    args: z.any(),
  })
  .and(
    z
      .object({
        state: z.enum(['partial-call', 'call']),
      })
      .or(
        z.object({
          state: z.literal('result'),
          result: z.any(),
        }),
      ),
  );

export const FinishReasonSchema = z.enum([
  'content-filter',
  'tool-calls',
  'error',
  'other',
  'unknown',
  'length',
  'stop',
]);

const refine = {
  annotations: z.any(),
  data: z.any(),
  finishReason: FinishReasonSchema,
  toolInvocations: z.array(ToolInvocationSchema),
};

export const MessageSchema = createSelectSchema(messages, refine);

export const CreateMessageSchema = createInsertSchema(messages, refine).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateMessageSchema = CreateMessageSchema.partial().omit({
  chatId: true,
  userId: true,
});
