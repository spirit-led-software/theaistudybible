import { messages } from '@/core/database/schema';
import { defaultRefine } from '@/schemas/utils/refine';
import type { Attachment, FinishReason, JSONValue, Message, ToolInvocation } from 'ai';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

const LiteralSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);
const JSONSchema: z.ZodType<JSONValue> = z.lazy(() =>
  z.union([LiteralSchema, z.array(JSONSchema), z.record(JSONSchema)]),
);

export const ToolCallSchema = z
  .object({
    state: z.enum(['partial-call', 'call']),
    step: z.number().optional(),
    toolName: z.string().min(1),
    toolCallId: z.string().min(1),
    args: z.record(JSONSchema),
  })
  .passthrough();

export const ToolResultSchema = z
  .object({
    state: z.literal('result'),
    step: z.number().optional(),
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
  'error',
  'length',
  'other',
  'stop',
  'tool-calls',
  'unknown',
]);

export const AttachmentSchema: z.ZodType<Attachment> = z.object({
  name: z.string().optional(),
  contentType: z.string().optional(),
  url: z.string().url(),
});

export const TextPartSchema = z.object({
  type: z.literal('text'),
  text: z.string(),
});

export const ReasoningPartSchema = z.object({
  type: z.literal('reasoning'),
  reasoning: z.string(),
  details: z.array(
    z.union([
      z.object({
        type: z.literal('text'),
        text: z.string(),
        signature: z.string().optional(),
      }),
      z.object({
        type: z.literal('redacted'),
        data: z.string(),
      }),
    ]),
  ),
});

export const ToolInvocationPartSchema = z.object({
  type: z.literal('tool-invocation'),
  toolInvocation: ToolInvocationSchema,
});

export const ProviderMetadataSchema = z.record(z.string(), z.record(z.string(), JSONSchema));

export const SourceSchema = z.object({
  sourceType: z.literal('url'),
  id: z.string(),
  url: z.string().url(),
  title: z.string().optional(),
  providerMetadata: ProviderMetadataSchema.optional(),
});

export const SourcePartSchema = z.object({
  type: z.literal('source'),
  source: SourceSchema,
});

export const FilePartSchema = z.object({
  type: z.literal('file'),
  mimeType: z.string(),
  data: z.string(),
});

export const StepStartPartSchema = z.object({
  type: z.literal('step-start'),
});

export const MessagePartSchema: z.ZodType<NonNullable<Message['parts']>[number]> =
  z.discriminatedUnion('type', [
    TextPartSchema,
    ReasoningPartSchema,
    ToolInvocationPartSchema,
    SourcePartSchema,
    FilePartSchema,
    StepStartPartSchema,
  ]);

const refine = {
  ...defaultRefine,
  annotations: z.array(JSONSchema).nullish(),
  data: JSONSchema.nullish(),
  finishReason: FinishReasonSchema.nullish(),
  toolInvocations: z.array(ToolInvocationSchema).nullish(),
  experimental_attachments: z.array(AttachmentSchema).nullish(),
  parts: z.array(MessagePartSchema).nullish(),
};

// @ts-ignore
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
