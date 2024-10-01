import type { parseUsx } from '@/core/utils/bibles/usx';

export type IndexChapterEvent = {
  bibleId: string;
  bookId: string;
  previousId: string | undefined;
  nextId: string | undefined;
  chapterNumber: string;
  content: ReturnType<typeof parseUsx>[number];
  generateEmbeddings: boolean;
};
