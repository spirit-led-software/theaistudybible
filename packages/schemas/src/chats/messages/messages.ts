import { messages } from '@/core/database/schema';
import type { FinishReason, ToolInvocation } from 'ai';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

const literalSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);
type Literal = z.infer<typeof literalSchema>;
type Json = Literal | { [key: string]: Json } | Json[];
const JsonSchema: z.ZodType<Json> = z.lazy(() =>
  z.union([literalSchema, z.array(JsonSchema), z.record(JsonSchema)]),
);

export const ToolCallSchema = z.object({
  state: z.enum(['partial-call', 'call']),
  toolName: z.string().min(1),
  toolCallId: z.string().min(1),
  args: z.object({}).passthrough(),
});

export const ToolResultSchema = z.object({
  state: z.literal('result'),
  toolName: z.string().min(1),
  toolCallId: z.string().min(1),
  args: z.object({}).passthrough(),
  result: JsonSchema,
});

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
  annotations: z.any(),
  data: z.any(),
  finishReason: FinishReasonSchema,
  toolInvocations: ToolInvocationSchema.array(),
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
