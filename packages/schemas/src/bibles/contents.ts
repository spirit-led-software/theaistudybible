import { z } from 'zod';

export const BaseContentSchema = z.object({
  id: z.string(),
  attrs: z.record(z.string(), z.string()).optional(),
});
export type BaseContent = z.infer<typeof BaseContentSchema>;

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

export type CharContent = BaseContent & {
  type: 'char';
  contents: Content[];
  verseId: string;
  verseNumber: number;
};
export const CharContentSchema: z.ZodType<CharContent> = z.lazy(() =>
  BaseContentSchema.extend({
    type: z.literal('char'),
    contents: ContentSchema.array(),
    verseId: z.string(),
    verseNumber: z.number(),
  }),
);

export type ParaContent = BaseContent & {
  type: 'para';
  contents: Content[];
};
export const ParaContentSchema: z.ZodType<ParaContent> = z.lazy(() =>
  BaseContentSchema.extend({
    type: z.literal('para'),
    contents: ContentSchema.array(),
  }),
);

export type NoteContent = BaseContent & {
  type: 'note';
  contents: Content[];
  verseId: string;
  verseNumber: number;
};
export const NoteContentSchema: z.ZodType<NoteContent> = z.lazy(() =>
  BaseContentSchema.extend({
    type: z.literal('note'),
    contents: ContentSchema.array(),
    verseId: z.string(),
    verseNumber: z.number(),
  }),
);

export const OwningContentSchema = z.union([
  CharContentSchema,
  ParaContentSchema,
  NoteContentSchema,
]);
export type OwningContent = z.infer<typeof OwningContentSchema>;

export const ContentSchema = z.union([OwningContentSchema, VerseContentSchema, TextContentSchema]);
export type Content = z.infer<typeof ContentSchema>;
