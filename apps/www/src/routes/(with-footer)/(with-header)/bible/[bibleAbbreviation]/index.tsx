import { db } from '@/core/database';
import { QueryBoundary } from '@/www/components/query-boundary';
import type { RouteDefinition } from '@solidjs/router';
import { Navigate, useParams } from '@solidjs/router';
import { GET } from '@solidjs/start';
import { createQuery, useQueryClient } from '@tanstack/solid-query';

export type BibleRedirectUrlParams = {
  bibleAbbreviation: string;
};

export const route: RouteDefinition = {
  preload: async ({ params }) => {
    const { bibleAbbreviation } = params;
    const qc = useQueryClient();
    await qc.prefetchQuery(getBibleRedirectUrlQueryOptions({ bibleAbbreviation }));
  },
};

const getBibleRedirectUrl = GET(async ({ bibleAbbreviation }: BibleRedirectUrlParams) => {
  'use server';
  const bibleData = await db.query.bibles.findFirst({
    where: (bibles, { eq }) => eq(bibles.abbreviation, bibleAbbreviation),
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

const getBibleRedirectUrlQueryOptions = ({ bibleAbbreviation }: BibleRedirectUrlParams) => ({
  queryKey: ['bible-redirect', { bibleAbbreviation }],
  queryFn: () => getBibleRedirectUrl({ bibleAbbreviation }),
});

export default function BiblePage() {
  const params = useParams();
  const query = createQuery(() =>
    getBibleRedirectUrlQueryOptions({ bibleAbbreviation: params.bibleAbbreviation }),
  );

  return (
    <QueryBoundary query={query}>
      {({ redirectUrl }) => <Navigate href={redirectUrl} />}
    </QueryBoundary>
  );
}
