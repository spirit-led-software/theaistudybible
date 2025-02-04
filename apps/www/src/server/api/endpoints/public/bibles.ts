import { db } from '@/core/database';
import { bibles, books, chapters, verses } from '@/core/database/schema';
import type { Bible, Book, Chapter, Verse } from '@/schemas/bibles/types';
import type { Bindings, Variables } from '@/www/server/api/types';
import { PaginationSchema, PaginationSchemaNoDefault } from '@/www/server/api/utils/pagination';
import { zValidator } from '@hono/zod-validator';
import type { SQL } from 'drizzle-orm';
import { and, count, eq, or, sql } from 'drizzle-orm';
import { Hono } from 'hono';
import { z } from 'zod';

export const app = new Hono<{
  Bindings: Bindings;
  Variables: Variables & {
    bible: Bible;
    book: Book & {
      previous: {
        code: string;
        name: string;
        number: number;
      } | null;
      next: {
        code: string;
        name: string;
        number: number;
      } | null;
    };
    chapter: Chapter & {
      previous: {
        code: string;
        name: string;
        number: number;
      } | null;
      next: {
        code: string;
        name: string;
        number: number;
      } | null;
    };
    verse: Verse & {
      previous: {
        code: string;
        name: string;
        number: number;
      } | null;
      next: {
        code: string;
        name: string;
        number: number;
      } | null;
    };
  };
}>()
  .use('/:id/*', async (c, next) => {
    const bibleId = c.req.param('id');

    const bible = await db.query.bibles.findFirst({
      where: (bibles, { eq }) => eq(bibles.abbreviation, bibleId),
    });
    if (!bible) {
      return c.json({ message: 'Bible not found' }, 404);
    }
    c.set('bible', bible);
    await next();
  })
  .use('/:id/books/:bookId/*', async (c, next) => {
    const bible = c.get('bible');
    const bookId = c.req.param('bookId');

    const book = await db.query.books.findFirst({
      where: and(
        eq(books.bibleAbbreviation, bible.abbreviation),
        or(eq(books.code, bookId), eq(books.abbreviation, bookId)),
      ),
      with: {
        previous: {
          columns: {
            code: true,
            number: true,
          },
          extras: {
            name: sql<string>`${books.shortName}`.as('previous_name'),
          },
        },
        next: {
          columns: {
            code: true,
            number: true,
          },
          extras: {
            name: sql<string>`${books.shortName}`.as('next_name'),
          },
        },
      },
    });
    if (!book) {
      return c.json({ message: 'Book not found' }, 404);
    }
    c.set('book', book);
    await next();
  })
  .use('/:id/chapters/:chapterCode/*', async (c, next) => {
    const bible = c.get('bible');
    const chapterCode = c.req.param('chapterCode');

    const chapter = await db.query.chapters.findFirst({
      where: and(
        eq(chapters.bibleAbbreviation, bible.abbreviation),
        eq(chapters.code, chapterCode),
      ),
      with: {
        previous: {
          columns: {
            code: true,
            name: true,
            number: true,
          },
        },
        next: {
          columns: {
            code: true,
            name: true,
            number: true,
          },
        },
      },
    });
    if (!chapter) {
      return c.json({ message: 'Chapter not found' }, 404);
    }
    c.set('chapter', chapter);
    await next();
  })
  .use('/:id/verses/:verseCode/*', async (c, next) => {
    const bible = c.get('bible');
    const verseCode = c.req.param('verseCode');

    const verse = await db.query.verses.findFirst({
      where: and(eq(verses.bibleAbbreviation, bible.abbreviation), eq(verses.code, verseCode)),
      with: {
        previous: {
          columns: {
            code: true,
            name: true,
            number: true,
          },
        },
        next: {
          columns: {
            code: true,
            name: true,
            number: true,
          },
        },
      },
    });
    if (!verse) {
      return c.json({ message: 'Verse not found' }, 404);
    }

    c.set('verse', verse);
    await next();
  })
  .get('/', zValidator('query', PaginationSchema(bibles)), async (c) => {
    const { cursor, limit, sort, filter } = c.req.valid('query');

    const [foundBibles, bibleCount] = await Promise.all([
      db.query.bibles.findMany({
        offset: cursor,
        limit,
        orderBy: sort,
        where: filter,
      }),
      db
        .select({
          count: count(),
        })
        .from(bibles)
        .where(filter)
        .then((res) => res[0].count),
    ]);

    return c.json(
      {
        data: foundBibles,
        nextCursor: foundBibles.length < limit ? undefined : cursor + limit,
        count: bibleCount,
      },
      200,
    );
  })
  .get('/:id', (c) => {
    return c.json(
      {
        data: c.var.bible,
      },
      200,
    );
  })
  .get('/:id/books', zValidator('query', PaginationSchema(books)), async (c) => {
    const { cursor, limit, sort, filter } = c.req.valid('query');

    let where: SQL<unknown> | undefined = eq(books.bibleAbbreviation, c.var.bible.abbreviation);
    if (filter) {
      where = and(where, filter);
    }

    const [foundBooks, bookCount] = await Promise.all([
      db.query.books.findMany({
        offset: cursor,
        limit,
        orderBy: sort,
        where,
        with: {
          previous: {
            columns: {
              abbreviation: true,
              number: true,
            },
            extras: {
              name: sql<string>`${books.shortName}`.as('previous_name'),
            },
          },
          next: {
            columns: {
              abbreviation: true,
              number: true,
            },
            extras: {
              name: sql<string>`${books.shortName}`.as('next_name'),
            },
          },
        },
      }),
      db
        .select({
          count: count(),
        })
        .from(books)
        .where(where)
        .then((res) => res[0].count),
    ]);

    return c.json(
      {
        data: foundBooks,
        nextCursor: foundBooks.length < limit ? undefined : cursor + limit,
        count: bookCount,
      },
      200,
    );
  })
  .get('/:id/books/:bookId', (c) => {
    return c.json(
      {
        data: c.var.book,
      },
      200,
    );
  })
  .get(
    '/:id/books/:bookId/chapters',
    zValidator(
      'query',
      PaginationSchemaNoDefault(chapters)
        .extend({
          'include-content': z
            .string()
            .optional()
            .default('false')
            .transform((v) => v === 'true'),
        })
        .optional()
        .transform((v) =>
          v
            ? v
            : {
                cursor: 0,
                limit: 10,
                filter: undefined,
                sort: undefined,
                'include-content': false,
              },
        ),
    ),
    async (c) => {
      const {
        cursor,
        limit,
        sort,
        filter,
        'include-content': includeContent,
      } = c.req.valid('query');

      let where: SQL<unknown> | undefined = eq(chapters.bookCode, c.var.book.code);
      if (filter) {
        where = and(where, filter);
      }

      const [foundChapters, chapterCount] = await Promise.all([
        db.query.chapters.findMany({
          offset: cursor,
          limit,
          orderBy: sort,
          where,
          columns: !includeContent
            ? {
                content: false,
              }
            : undefined,
          with: {
            previous: {
              columns: {
                code: true,
                name: true,
                number: true,
              },
            },
            next: {
              columns: {
                code: true,
                name: true,
                number: true,
              },
            },
          },
        }),
        db
          .select({
            count: count(),
          })
          .from(chapters)
          .where(where)
          .then((res) => res[0].count),
      ]);

      return c.json(
        {
          data: foundChapters,
          nextCursor: foundChapters.length < limit ? undefined : cursor + limit,
          count: chapterCount,
        },
        200,
      );
    },
  )
  .get(
    '/:id/chapters/:chapterCode',
    zValidator(
      'query',
      z
        .object({
          'include-content': z
            .string()
            .optional()
            .default('false')
            .transform((v) => v === 'true'),
        })
        .optional()
        .transform((v) => v || { 'include-content': false }),
    ),
    (c) => {
      const { 'include-content': includeContent } = c.req.valid('query');

      const { content, ...rest } = c.var.chapter;

      return c.json(
        {
          data: includeContent ? c.var.chapter : rest,
        },
        200,
      );
    },
  )
  .get('/:id/verses', zValidator('query', PaginationSchema(verses)), async (c) => {
    const { cursor, limit, sort, filter } = c.req.valid('query');

    let where: SQL<unknown> | undefined = eq(verses.bibleAbbreviation, c.var.bible.abbreviation);
    if (filter) {
      where = and(where, filter);
    }

    const [foundVerses, verseCount] = await Promise.all([
      db.query.verses.findMany({
        offset: cursor,
        limit,
        orderBy: sort,
        where,
      }),
      db
        .select({
          count: count(),
        })
        .from(verses)
        .where(where)
        .then((res) => res[0].count),
    ]);

    return c.json(
      {
        data: foundVerses,
        nextCursor: foundVerses.length < limit ? undefined : cursor + limit,
        count: verseCount,
      },
      200,
    );
  })
  .get('/:id/verses/:verseCode', (c) => {
    return c.json({ data: c.var.verse }, 200);
  });

export default app;
