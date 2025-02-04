import type { parseUsx } from '@/core/utils/bibles/usx';

export type IndexChapterEvent = {
  bibleAbbreviation: string;
  bookCode: string;
  previousCode: string | undefined;
  nextCode: string | undefined;
  chapterNumber: string;
  content: ReturnType<typeof parseUsx>[number];
  generateEmbeddings: boolean;
  overwrite: boolean;
};
