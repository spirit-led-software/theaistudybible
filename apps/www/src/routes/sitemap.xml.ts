import { db } from '@/core/database';
import { XMLBuilder } from 'fast-xml-parser';

export const GET = async () => {
  const sitemapXmlBuilder = new XMLBuilder({
    ignoreAttributes: false,
    attributeNamePrefix: '$',
  });

  const devotions = await db.query.devotions.findMany({
    columns: { id: true },
  });

  const bibles = await db.query.bibles.findMany({
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

  const sitemapXml = sitemapXmlBuilder.build({
    urlset: {
      $xmlns: 'http://www.sitemaps.org/schemas/sitemap/0.9',
      url: [
        { loc: 'https://theaistudybible.com' },
        { loc: 'https://theaistudybible.com/about' },
        { loc: 'https://theaistudybible.com/about/install' },
        { loc: 'https://theaistudybible.com/contact' },
        { loc: 'https://theaistudybible.com/privacy' },
        { loc: 'https://theaistudybible.com/terms' },
        { loc: 'https://theaistudybible.com/sign-in' },
        { loc: 'https://theaistudybible.com/sign-up' },
        { loc: 'https://theaistudybible.com/forgot-password' },
        ...devotions.map((devotion) => ({
          loc: `https://theaistudybible.com/devotion/${devotion.id}`,
        })),
        ...bibles.flatMap((bible) =>
          bible.books.flatMap((book) =>
            book.chapters.flatMap((chapter) => ({
              loc: `https://theaistudybible.com/bible/${bible.abbreviation}/${book.code}/${chapter.number}`,
            })),
          ),
        ),
        ...bibles.flatMap((bible) =>
          bible.books.flatMap((book) =>
            book.chapters.flatMap((chapter) =>
              chapter.verses.map((verse) => ({
                loc: `https://theaistudybible.com/bible/${bible.abbreviation}/${book.code}/${chapter.number}/${verse.number}`,
              })),
            ),
          ),
        ),
      ],
    },
  });

  return new Response(sitemapXml, { headers: { 'Content-Type': 'application/xml' } });
};
