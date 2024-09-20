import { db } from '@/core/database';
import { QueryBoundary } from '@/www/components/query-boundary';
import { WithHeaderLayout } from '@/www/layouts/with-header';
import type { RouteDefinition } from '@solidjs/router';
import { Navigate, useParams } from '@solidjs/router';
import { createQuery, useQueryClient } from '@tanstack/solid-query';

export type BookRedirectUrlParams = {
  bibleAbbr: string;
  bookAbbr: string;
};

const getBookRedirectUrl = async ({ bibleAbbr, bookAbbr }: BookRedirectUrlParams) => {
  'use server';
  const bibleData = await db.query.bibles.findFirst({
    where: (bibles, { eq }) => eq(bibles.abbreviation, bibleAbbr),
    columns: { abbreviation: true },
    with: {
      books: {
        where: (books, { eq }) => eq(books.abbreviation, bookAbbr),
        columns: { abbreviation: true },
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

  return { redirectUrl: `/bible/${bible.abbreviation}/${book.abbreviation}/${chapter.number}` };
};

const getBookRedirectUrlQueryOptions = ({ bibleAbbr, bookAbbr }: BookRedirectUrlParams) => ({
  queryKey: ['book-redirect', bibleAbbr, bookAbbr],
  queryFn: () => getBookRedirectUrl({ bibleAbbr, bookAbbr }),
});

export const route: RouteDefinition = {
  preload: ({ params }) => {
    const { bibleAbbr, bookAbbr } = params;
    const qc = useQueryClient();
    void qc.prefetchQuery(getBookRedirectUrlQueryOptions({ bibleAbbr, bookAbbr }));
  },
};

export default function BookPage() {
  const params = useParams();
  const query = createQuery(() =>
    getBookRedirectUrlQueryOptions({
      bibleAbbr: params.bibleAbbr,
      bookAbbr: params.bookAbbr,
    }),
  );

  return (
    <WithHeaderLayout>
      <QueryBoundary query={query}>
        {({ redirectUrl }) => <Navigate href={redirectUrl} />}
      </QueryBoundary>
    </WithHeaderLayout>
  );
}
