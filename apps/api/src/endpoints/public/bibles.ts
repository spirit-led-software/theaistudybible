import { zValidator } from '@hono/zod-validator';
import {
  PaginationSchema,
  PaginationSchemaNoDefault
} from '@theaistudybible/api/lib/utils/pagination';
import type { Bindings, Variables } from '@theaistudybible/api/types';
import {
  bibles,
  books,
  chapterHighlights,
  chapters,
  verses
} from '@theaistudybible/core/database/schema';
import type { Bible, Book, Chapter, Verse } from '@theaistudybible/core/model/bible';
import { db } from '@theaistudybible/server/lib/database';
import { SQL, and, count, eq, inArray, or, sql } from 'drizzle-orm';
import { Hono } from 'hono';
import { z } from 'zod';

export const app = new Hono<{
  Bindings: Bindings;
  Variables: Variables & {
    bible: Bible;
    book: Book & {
      previous: {
        id: string;
        abbreviation: string;
        name: string;
        number: number;
      } | null;
      next: {
        id: string;
        abbreviation: string;
        name: string;
        number: number;
      } | null;
    };
    chapter: Chapter & {
      previous: {
        id: string;
        abbreviation: string;
        name: string;
        number: number;
      } | null;
      next: {
        id: string;
        abbreviation: string;
        name: string;
        number: number;
      } | null;
    };
    verse: Verse & {
      previous: {
        id: string;
        abbreviation: string;
        name: string;
        number: number;
      } | null;
      next: {
        id: string;
        abbreviation: string;
        name: string;
        number: number;
      } | null;
    };
  };
}>()
  .use('/:id/*', async (c, next) => {
    const bibleId = c.req.param('id');

    const bible = await db.query.bibles.findFirst({
      where: or(eq(bibles.id, bibleId), eq(bibles.abbreviation, bibleId))
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
        eq(books.bibleId, bible.id),
        or(eq(books.id, bookId), eq(books.abbreviation, bookId))
      ),
      with: {
        previous: {
          columns: {
            id: true,
            abbreviation: true,
            number: true
          },
          extras: {
            name: sql<string>`${books.shortName}`.as('previous_name')
          }
        },
        next: {
          columns: {
            id: true,
            abbreviation: true,
            number: true
          },
          extras: {
            name: sql<string>`${books.shortName}`.as('next_name')
          }
        }
      }
    });
    if (!book) {
      return c.json({ message: 'Book not found' }, 404);
    }
    c.set('book', book);
    await next();
  })
  .use('/:id/chapters/:chapterId/*', async (c, next) => {
    const bible = c.get('bible');
    const chapterId = c.req.param('chapterId');

    const chapter = await db.query.chapters.findFirst({
      where: and(
        eq(chapters.bibleId, bible.id),
        or(eq(chapters.id, chapterId), eq(chapters.abbreviation, chapterId))
      ),
      with: {
        previous: {
          columns: {
            id: true,
            abbreviation: true,
            name: true,
            number: true
          }
        },
        next: {
          columns: {
            id: true,
            abbreviation: true,
            name: true,
            number: true
          }
        }
      }
    });
    if (!chapter) {
      return c.json({ message: 'Chapter not found' }, 404);
    }
    c.set('chapter', chapter);
    await next();
  })
  .use('/:id/verses/:verseId/*', async (c, next) => {
    const bible = c.get('bible');
    const verseId = c.req.param('verseId');

    const verse = await db.query.verses.findFirst({
      where: and(
        eq(verses.bibleId, bible.id),
        or(eq(verses.id, verseId), eq(verses.abbreviation, verseId))
      ),
      with: {
        previous: {
          columns: {
            id: true,
            abbreviation: true,
            name: true,
            number: true
          }
        },
        next: {
          columns: {
            id: true,
            abbreviation: true,
            name: true,
            number: true
          }
        }
      }
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
        where: filter
      }),
      db
        .select({
          count: count()
        })
        .from(bibles)
        .where(filter)
        .then((res) => res[0].count)
    ]);

    return c.json(
      {
        data: foundBibles,
        nextCursor: foundBibles.length < limit ? undefined : cursor + limit,
        count: bibleCount
      },
      200
    );
  })
  .get('/:id', async (c) => {
    return c.json(
      {
        data: c.var.bible
      },
      200
    );
  })
  .get('/:id/books', zValidator('query', PaginationSchema(books)), async (c) => {
    const { cursor, limit, sort, filter } = c.req.valid('query');

    let where: SQL<unknown> | undefined = eq(books.bibleId, c.var.bible.id);
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
              id: true,
              abbreviation: true,
              number: true
            },
            extras: {
              name: sql<string>`${books.shortName}`.as('previous_name')
            }
          },
          next: {
            columns: {
              id: true,
              abbreviation: true,
              number: true
            },
            extras: {
              name: sql<string>`${books.shortName}`.as('next_name')
            }
          }
        }
      }),
      db
        .select({
          count: count()
        })
        .from(books)
        .where(where)
        .then((res) => res[0].count)
    ]);

    return c.json(
      {
        data: foundBooks,
        nextCursor: foundBooks.length < limit ? undefined : cursor + limit,
        count: bookCount
      },
      200
    );
  })
  .get('/:id/books/:bookId', async (c) => {
    return c.json(
      {
        data: c.var.book
      },
      200
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
            .transform((v) => v === 'true')
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
                'include-content': false
              }
        )
    ),
    async (c) => {
      const {
        cursor,
        limit,
        sort,
        filter,
        'include-content': includeContent
      } = c.req.valid('query');

      let where: SQL<unknown> | undefined = eq(chapters.bookId, c.var.book.id);
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
                content: false
              }
            : undefined,
          with: {
            previous: {
              columns: {
                id: true,
                name: true,
                number: true
              }
            },
            next: {
              columns: {
                id: true,
                name: true,
                number: true
              }
            }
          }
        }),
        db
          .select({
            count: count()
          })
          .from(chapters)
          .where(where)
          .then((res) => res[0].count)
      ]);

      return c.json(
        {
          data: foundChapters,
          nextCursor: foundChapters.length < limit ? undefined : cursor + limit,
          count: chapterCount
        },
        200
      );
    }
  )
  .get(
    '/:id/chapters/:chapterId',
    zValidator(
      'query',
      z
        .object({
          'include-content': z
            .string()
            .optional()
            .default('false')
            .transform((v) => v === 'true')
        })
        .optional()
        .transform((v) => v || { 'include-content': false })
    ),
    async (c) => {
      const { 'include-content': includeContent } = c.req.valid('query');
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { content, ...rest } = c.var.chapter;

      return c.json(
        {
          data: includeContent ? c.var.chapter : rest
        },
        200
      );
    }
  )
  .post(
    '/:id/chapters/:chapterId/highlights',
    zValidator(
      'json',
      z.object({
        color: z
          .string()
          .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid color format')
          .optional()
          .default('#FFD700'),
        ids: z.array(z.string())
      })
    ),
    async (c) => {
      const { color, ids } = c.req.valid('json');

      if (!c.var.clerkAuth?.userId) {
        return c.json({ message: 'Unauthorized' }, 401);
      }

      const highlights = await db
        .insert(chapterHighlights)
        .values(
          ids.map((id) => ({
            id,
            color,
            userId: c.var.clerkAuth!.userId!,
            chapterId: c.var.chapter.id
          }))
        )
        .onConflictDoUpdate({
          target: [chapterHighlights.id],
          set: {
            color
          }
        })
        .returning();

      return c.json(
        {
          data: highlights
        },
        200
      );
    }
  )
  .get('/:id/chapters/:chapterId/highlights', async (c) => {
    if (!c.var.clerkAuth?.userId) {
      return c.json({ message: 'Unauthorized' }, 401);
    }

    const highlights = await db.query.chapterHighlights.findMany({
      where: and(
        eq(chapterHighlights.chapterId, c.var.chapter.id),
        eq(chapterHighlights.userId, c.var.clerkAuth.userId)
      )
    });
    if (!highlights) {
      return c.json(
        {
          message: 'No highlights found'
        },
        404
      );
    }

    return c.json(
      {
        data: highlights
      },
      200
    );
  })
  .delete(
    '/:id/chapters/:chapterId/highlights',
    zValidator(
      'json',
      z.object({
        ids: z.array(z.string())
      })
    ),
    async (c) => {
      if (!c.var.clerkAuth?.userId) {
        return c.json({ message: 'Unauthorized' }, 401);
      }

      const { ids } = c.req.valid('json');

      const highlights = await db.query.chapterHighlights.findFirst({
        where: and(
          eq(chapterHighlights.chapterId, c.var.chapter.id),
          eq(chapterHighlights.userId, c.var.clerkAuth.userId)
        )
      });
      if (!highlights) {
        return c.json(
          {
            message: 'No highlights found'
          },
          404
        );
      }

      await db
        .delete(chapterHighlights)
        .where(
          and(
            eq(chapterHighlights.chapterId, c.var.chapter.id),
            eq(chapterHighlights.userId, c.var.clerkAuth.userId),
            inArray(chapterHighlights.id, ids)
          )
        );

      return c.json(
        {
          message: 'Highlights deleted'
        },
        200
      );
    }
  )
  .get('/:id/verses', zValidator('query', PaginationSchema(verses)), async (c) => {
    const { cursor, limit, sort, filter } = c.req.valid('query');

    let where: SQL<unknown> | undefined = eq(verses.bibleId, c.var.bible.id);
    if (filter) {
      where = and(where, filter);
    }

    const [foundVerses, verseCount] = await Promise.all([
      db.query.verses.findMany({
        offset: cursor,
        limit,
        orderBy: sort,
        where
      }),
      db
        .select({
          count: count()
        })
        .from(verses)
        .where(where)
        .then((res) => res[0].count)
    ]);

    return c.json(
      {
        data: foundVerses,
        nextCursor: foundVerses.length < limit ? undefined : cursor + limit,
        count: verseCount
      },
      200
    );
  })
  .get('/:id/verses/:verseId', async (c) => {
    return c.json(
      {
        data: c.var.verse
      },
      200
    );
  });

export default app;
