import { z } from 'zod';

export const BaseContentSchema = z.object({
  id: z.string(),
  attrs: z.record(z.string(), z.string()).optional(),
});
export type BaseContent = z.infer<typeof BaseContentSchema>;

export const VerseContentSchema = BaseContentSchema.extend({
  type: z.literal('verse'),
  code: z.string(),
  number: z.number(),
});
export type VerseContent = z.infer<typeof VerseContentSchema>;

export const TextContentSchema = BaseContentSchema.extend({
  type: z.union([z.literal('text'), z.literal('ref')]),
  text: z.string(),
  verseCode: z.string(),
  verseNumber: z.number(),
});
export type TextContent = z.infer<typeof TextContentSchema>;

export type CharContent = BaseContent & {
  type: 'char';
  contents: Content[];
  verseCode: string;
  verseNumber: number;
};
export const CharContentSchema: z.ZodType<CharContent> = BaseContentSchema.extend({
  type: z.literal('char'),
  contents: z.lazy(() => ContentSchema.array()),
  verseCode: z.string(),
  verseNumber: z.number(),
});

export type ParaContent = BaseContent & {
  type: 'para';
  contents: Content[];
};
export const ParaContentSchema: z.ZodType<ParaContent> = BaseContentSchema.extend({
  type: z.literal('para'),
  contents: z.lazy(() => ContentSchema.array()),
});

export type NoteContent = BaseContent & {
  type: 'note';
  contents: Content[];
  verseCode: string;
  verseNumber: number;
};
export const NoteContentSchema: z.ZodType<NoteContent> = BaseContentSchema.extend({
  type: z.literal('note'),
  contents: z.lazy(() => ContentSchema.array()),
  verseCode: z.string(),
  verseNumber: z.number(),
});

export type Content = VerseContent | TextContent | CharContent | ParaContent | NoteContent;
export const ContentSchema: z.ZodType<Content> = z.lazy(() =>
  z.union([OwningContentSchema, VerseContentSchema, TextContentSchema]),
);

export const OwningContentSchema = z.union([
  CharContentSchema,
  ParaContentSchema,
  NoteContentSchema,
]);
export type OwningContent = z.infer<typeof OwningContentSchema>;
