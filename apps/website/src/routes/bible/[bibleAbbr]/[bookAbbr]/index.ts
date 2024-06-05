import { db } from '@lib/server/database';
import { APIEvent } from '@solidjs/start/server';
import { chapters } from '@theaistudybible/core/database/schema';
import { asc } from 'drizzle-orm';

export const GET = async ({ params }: APIEvent) => {
  const { bibleAbbr, bookAbbr } = params;

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
    console.log('Insufficient data');
    return new Response(null, {
      status: 302,
      headers: {
        Location: `/bible`
      }
    });
  }

  return new Response(null, {
    status: 302,
    headers: {
      Location: `/bible/${bibleAbbr}/${book.abbreviation}/${chapter.number}`
    }
  });
};
