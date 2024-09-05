import { z } from 'zod';

export const BaseContentSchema = z.object({
  id: z.string(),
  attrs: z.record(z.string(), z.string()).optional(),
});

export const VerseContentSchema = BaseContentSchema.extend({
  type: z.literal('verse'),
  number: z.number(),
});

export type VerseContent = z.infer<typeof VerseContentSchema>;

export const TextContentSchema = BaseContentSchema.extend({
  type: z.union([z.literal('text'), z.literal('ref')]),
  text: z.string(),
  verseId: z.string(),
  verseNumber: z.number(),
});

export type TextContent = z.infer<typeof TextContentSchema>;

export type CharContent = {
  type: 'char';
  contents: Content[];
  verseId: string;
  verseNumber: number;
  id: string;
  attrs?: Record<string, string>;
};

export const CharContentSchema: z.ZodType<CharContent> = BaseContentSchema.extend({
  type: z.literal('char'),
  contents: z.lazy(() => ContentSchema.array()),
  verseId: z.string(),
  verseNumber: z.number(),
});

export type ParaContent = {
  type: 'para';
  contents: Content[];
  id: string;
  attrs?: Record<string, string>;
};

export const ParaContentSchema: z.ZodType<ParaContent> = BaseContentSchema.extend({
  type: z.literal('para'),
  contents: z.lazy(() => ContentSchema.array()),
});

export type NoteContent = {
  type: 'note';
  contents: Content[];
  verseId: string;
  verseNumber: number;
  id: string;
  attrs?: Record<string, string>;
};

export const NoteContentSchema = BaseContentSchema.extend({
  type: z.literal('note'),
  contents: z.lazy(() => ContentSchema.array()),
  verseId: z.string(),
  verseNumber: z.number(),
});

export const OwningContentSchema = z.union([
  CharContentSchema,
  ParaContentSchema,
  NoteContentSchema,
]);

export type OwningContent = z.infer<typeof OwningContentSchema>;

export type Content = CharContent | VerseContent | TextContent | ParaContent | NoteContent;

export const ContentSchema: z.ZodType<Content> = z.union([
  OwningContentSchema,
  VerseContentSchema,
  TextContentSchema,
]);
