import { db } from '@/core/database';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

export const Route = createFileRoute('/_with-footer/_with-header/bible_/$bibleAbbreviation')({
  params: z.object({
    bibleAbbreviation: z.string(),
  }),
  beforeLoad: async ({ params }) => {
    if ('chapter' in params) {
      return;
    }
    const { bible, book, chapter } = await getRedirectData({
      data: { bibleAbbreviation: params.bibleAbbreviation },
    });
    throw redirect({
      to: '/bible/$bibleAbbreviation/$bookCode/$chapterNumber',
      params: {
        bibleAbbreviation: bible.abbreviation,
        bookCode: book.code,
        chapterNumber: chapter.number,
      },
    });
  },
});

const getRedirectData = createServerFn({ method: 'GET' })
  .validator(
    z.object({
      bibleAbbreviation: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    const bibleData = await db.query.bibles.findFirst({
      where: (bibles, { eq }) => eq(bibles.abbreviation, data.bibleAbbreviation),
      columns: { abbreviation: true },
      with: {
        books: {
          limit: 1,
          orderBy: (books, { asc }) => asc(books.number),
          columns: { code: true },
          with: {
            chapters: {
              limit: 1,
              orderBy: (chapters, { asc }) => asc(chapters.number),
              columns: { number: true },
            },
          },
        },
      },
    });
    if (!bibleData) {
      throw new Error('Bible not found');
    }

    const { books, ...bible } = bibleData;
    if (!books[0]) {
      throw new Error('Book not found');
    }

    const { chapters, ...book } = books[0];
    if (!chapters[0]) {
      throw new Error('Chapter not found');
    }

    const chapter = chapters[0];

    return {
      bible,
      book,
      chapter,
    };
  });
