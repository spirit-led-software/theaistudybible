import { messages } from '@/core/database/schema';
import { defaultRefine } from '@/schemas/utils/refine';
import type { FinishReason, JSONValue, ToolInvocation } from 'ai';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

const LiteralSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);
const JSONSchema: z.ZodType<JSONValue> = z.lazy(() =>
  z.union([LiteralSchema, z.array(JSONSchema), z.record(JSONSchema)]),
);

export const ToolCallSchema = z
  .object({
    state: z.enum(['partial-call', 'call']),
    toolName: z.string().min(1),
    toolCallId: z.string().min(1),
    args: z.record(JSONSchema),
  })
  .passthrough();

export const ToolResultSchema = z
  .object({
    state: z.literal('result'),
    toolName: z.string().min(1),
    toolCallId: z.string().min(1),
    args: z.record(JSONSchema),
    result: JSONSchema,
  })
  .passthrough();

export const ToolInvocationSchema: z.ZodType<ToolInvocation> = z.discriminatedUnion('state', [
  ToolCallSchema,
  ToolResultSchema,
]);

export const FinishReasonSchema: z.ZodType<FinishReason> = z.enum([
  'content-filter',
  'tool-calls',
  'error',
  'other',
  'unknown',
  'length',
  'stop',
]);

const refine = {
  ...defaultRefine,
  annotations: z.array(JSONSchema).nullish(),
  data: JSONSchema.nullish(),
  finishReason: FinishReasonSchema.nullish(),
  toolInvocations: z.array(ToolInvocationSchema).nullish(),
};

// @ts-expect-error - Circular dependency
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

export * from './reactions';
