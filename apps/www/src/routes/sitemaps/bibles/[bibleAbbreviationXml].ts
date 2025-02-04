import { db } from '@/core/database';
import type { APIHandler } from '@solidjs/start/server';
import { XMLBuilder } from 'fast-xml-parser';

export const GET: APIHandler = async ({ params }) => {
  const sitemapXmlBuilder = new XMLBuilder({
    ignoreAttributes: false,
    attributeNamePrefix: '$',
  });

  const bibleAbbreviation = params.bibleAbbreviationXml.split('.')[0];

  const bible = await db.query.bibles.findFirst({
    where: (bibles, { eq }) => eq(bibles.abbreviation, bibleAbbreviation),
    columns: { abbreviation: true },
    with: {
      books: {
        columns: { code: true },
        with: {
          chapters: {
            columns: { number: true },
            with: {
              verses: { columns: { number: true } },
            },
          },
        },
      },
    },
  });
  if (!bible) {
    return new Response('Bible not found', { status: 404 });
  }

  const sitemapXml = sitemapXmlBuilder.build({
    urlset: {
      $xmlns: 'http://www.sitemaps.org/schemas/sitemap/0.9',
      url: bible.books.flatMap((book) =>
        book.chapters.flatMap((chapter) => ({
          loc: `https://theaistudybible.com/bible/${bible.abbreviation}/${book.code}/${chapter.number}`,
        })),
      ),
    },
  });

  return new Response(sitemapXml, { status: 200, headers: { 'Content-Type': 'application/xml' } });
};
