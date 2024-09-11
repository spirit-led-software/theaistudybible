import { db } from '@/core/database';
import { books, chapters } from '@/core/database/schema';
import { QueryBoundary } from '@/www/components/query-boundary';
import type { RouteDefinition } from '@solidjs/router';
import { Navigate, useParams } from '@solidjs/router';
import { createQuery, useQueryClient } from '@tanstack/solid-query';
import { asc } from 'drizzle-orm';

export type BibleRedirectUrlParams = {
  bibleAbbr: string;
};

export const route: RouteDefinition = {
  preload: async ({ params }) => {
    const { bibleAbbr } = params;
    const qc = useQueryClient();
    await qc.prefetchQuery(getBibleRedirectUrlQueryOptions({ bibleAbbr }));
  },
};

const getBibleRedirectUrl = async ({ bibleAbbr }: BibleRedirectUrlParams) => {
  'use server';
  const bible = await db.query.bibles.findFirst({
    where: (bibles, { eq }) => eq(bibles.abbreviation, bibleAbbr),
    with: {
      books: {
        limit: 1,
        orderBy: asc(books.number),
        with: {
          chapters: {
            limit: 1,
            orderBy: asc(chapters.number),
          },
        },
      },
    },
  });

  const book = bible?.books[0];
  const chapter = book?.chapters[0];

  if (!bible || !book || !chapter) {
    throw new Error('Insufficient data');
  }

  return `/bible/${bibleAbbr}/${book.abbreviation}/${chapter.number}`;
};

const getBibleRedirectUrlQueryOptions = ({ bibleAbbr }: BibleRedirectUrlParams) => ({
  queryKey: ['bible-redirect', bibleAbbr],
  queryFn: () => getBibleRedirectUrl({ bibleAbbr }),
});

export default function BiblePage() {
  const params = useParams();
  const query = createQuery(() => getBibleRedirectUrlQueryOptions({ bibleAbbr: params.bibleAbbr }));

  return <QueryBoundary query={query}>{(link) => <Navigate href={link} />}</QueryBoundary>;
}