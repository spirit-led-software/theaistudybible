import { db } from '@/core/database';
import { QueryBoundary } from '@/www/components/query-boundary';
import { WithHeaderLayout } from '@/www/layouts/with-header';
import { serverFn } from '@/www/server/server-fn';
import type { RouteDefinition } from '@solidjs/router';
import { Navigate, useParams } from '@solidjs/router';
import { createQuery, useQueryClient } from '@tanstack/solid-query';

export type BibleRedirectUrlParams = {
  bibleAbbr: string;
};

export const route: RouteDefinition = {
  preload: ({ params }) => {
    const { bibleAbbr } = params;
    const qc = useQueryClient();
    qc.prefetchQuery(getBibleRedirectUrlQueryOptions({ bibleAbbr }));
  },
};

const getBibleRedirectUrl = serverFn(async ({ bibleAbbr }: BibleRedirectUrlParams) => {
  const bibleData = await db.query.bibles.findFirst({
    where: (bibles, { eq }) => eq(bibles.abbreviation, bibleAbbr),
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

  return { redirectUrl: `/bible/${bible.abbreviation}/${book.code}/${chapter.number}` };
});

const getBibleRedirectUrlQueryOptions = ({ bibleAbbr }: BibleRedirectUrlParams) => ({
  queryKey: ['bible-redirect', bibleAbbr],
  queryFn: () => getBibleRedirectUrl({ bibleAbbr }),
});

export default function BiblePage() {
  const params = useParams();
  const query = createQuery(() => getBibleRedirectUrlQueryOptions({ bibleAbbr: params.bibleAbbr }));

  return (
    <WithHeaderLayout>
      <QueryBoundary query={query}>
        {({ redirectUrl }) => <Navigate href={redirectUrl} />}
      </QueryBoundary>
    </WithHeaderLayout>
  );
}
