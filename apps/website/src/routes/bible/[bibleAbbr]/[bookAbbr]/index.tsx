import { db } from '@lib/server/database';
import { Navigate, RouteDefinition, useParams } from '@solidjs/router';
import { createQuery, useQueryClient } from '@tanstack/solid-query';
import { chapters } from '@theaistudybible/core/database/schema';
import { asc } from 'drizzle-orm';
import { QueryBoundary } from '~/components/query-boundary';

export type BookRedirectUrlParams = {
  bibleAbbr: string;
  bookAbbr: string;
};

export const route: RouteDefinition = {
  load: async ({ params }) => {
    const { bibleAbbr, bookAbbr } = params;
    const qc = useQueryClient();
    await qc.prefetchQuery(getBookRedirectUrlQueryOptions({ bibleAbbr, bookAbbr }));
  }
};

const getBookRedirectUrl = async ({ bibleAbbr, bookAbbr }: BookRedirectUrlParams) => {
  'use server';
  const bible = await db.query.bibles.findFirst({
    where: (bibles, { eq }) => eq(bibles.abbreviation, bibleAbbr),
    with: {
      books: {
        where: (books, { eq }) => eq(books.abbreviation, bookAbbr),
        with: {
          chapters: {
            limit: 1,
            orderBy: asc(chapters.number)
          }
        }
      }
    }
  });

  const book = bible?.books[0];
  const chapter = book?.chapters[0];

  if (!bible || !book || !chapter) {
    throw new Error('Insufficient data');
  }

  return `/bible/${bibleAbbr}/${book.abbreviation}/${chapter.number}`;
};

const getBookRedirectUrlQueryOptions = ({ bibleAbbr, bookAbbr }: BookRedirectUrlParams) => ({
  queryKey: ['book-redirect', bibleAbbr, bookAbbr],
  queryFn: () => getBookRedirectUrl({ bibleAbbr, bookAbbr })
});

export default function BookPage() {
  const params = useParams();
  const query = createQuery(() =>
    getBookRedirectUrlQueryOptions({
      bibleAbbr: params.bibleAbbr,
      bookAbbr: params.bookAbbr
    })
  );

  return <QueryBoundary query={query}>{(link) => <Navigate href={link} />}</QueryBoundary>;
}
