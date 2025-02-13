import { db } from '@/core/database';
import { QueryBoundary } from '@/www/components/query-boundary';
import type { RouteDefinition } from '@solidjs/router';
import { Navigate, useParams } from '@solidjs/router';
import { GET } from '@solidjs/start';
import { createQuery, useQueryClient } from '@tanstack/solid-query';

export type BookRedirectUrlParams = {
  bibleAbbreviation: string;
  bookCode: string;
};

const getBookRedirectUrl = GET(async ({ bibleAbbreviation, bookCode }: BookRedirectUrlParams) => {
  'use server';
  const bibleData = await db.query.bibles.findFirst({
    where: (bibles, { eq }) => eq(bibles.abbreviation, bibleAbbreviation),
    columns: { abbreviation: true },
    with: {
      books: {
        where: (books, { eq }) => eq(books.code, bookCode),
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

  return { redirectUrl: `/bible/${bible.abbreviation}/${book.code}/${chapter.number}` };
});

const getBookRedirectUrlQueryOptions = ({
  bibleAbbreviation,
  bookCode,
}: BookRedirectUrlParams) => ({
  queryKey: ['book-redirect', { bibleAbbreviation, bookCode }],
  queryFn: () => getBookRedirectUrl({ bibleAbbreviation, bookCode }),
});

export const route: RouteDefinition = {
  preload: async ({ params }) => {
    const qc = useQueryClient();
    await qc.prefetchQuery(getBookRedirectUrlQueryOptions(params as BookRedirectUrlParams));
  },
};

export default function BookPage() {
  const params = useParams();
  const query = createQuery(() =>
    getBookRedirectUrlQueryOptions({
      bibleAbbreviation: params.bibleAbbreviation,
      bookCode: params.bookCode,
    }),
  );

  return (
    <QueryBoundary query={query}>
      {({ redirectUrl }) => <Navigate href={redirectUrl} />}
    </QueryBoundary>
  );
}
