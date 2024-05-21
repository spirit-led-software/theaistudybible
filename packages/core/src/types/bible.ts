export type BaseContent = {
  id: string;
  attrs?: Record<string, string>;
};

export const NonOwningContentTypes = ['verse', 'text', 'ref'] as const;
export const OwningContentTypes = ['para', 'char', 'note'] as const;

export const SupportedContentTypes = [...NonOwningContentTypes, ...OwningContentTypes] as const;

export type VerseContent = BaseContent & {
  type: 'verse';
  number: number;
};

export type TextContent = BaseContent & {
  type: 'text' | 'ref';
  text: string;
  verseId: string;
  verseNumber: number;
};

export type CharContent = BaseContent & {
  type: 'char';
  contents: Content[];
  verseId: string;
  verseNumber: number;
};

export type ParaContent = BaseContent & {
  type: 'para';
  contents: Content[];
};

export type NoteContent = BaseContent & {
  type: 'note';
  contents: Content[];
  verseId: string;
  verseNumber: number;
};

export type OwningContent = CharContent | ParaContent | NoteContent;

export type Content = OwningContent | VerseContent | TextContent;
