import { db } from '@/core/database';
import type { APIHandler } from '@solidjs/start/server';
import { XMLBuilder } from 'fast-xml-parser';

export const GET: APIHandler = async () => {
  const sitemapXmlBuilder = new XMLBuilder({
    ignoreAttributes: false,
    attributeNamePrefix: '$',
  });

  const bibles = await db().query.bibles.findMany({
    columns: { abbreviation: true },
  });

  const sitemapXml = sitemapXmlBuilder.build({
    sitemapindex: {
      $xmlns: 'http://www.sitemaps.org/schemas/sitemap/0.9',
      sitemap: [
        { loc: 'https://theaistudybible.com/sitemaps/static.xml' },
        { loc: 'https://theaistudybible.com/sitemaps/devotions.xml' },
        ...bibles.map((bible) => ({
          loc: `https://theaistudybible.com/sitemaps/bibles/${bible.abbreviation}.xml`,
        })),
      ],
    },
  });

  return new Response(sitemapXml, { status: 200, headers: { 'Content-Type': 'application/xml' } });
};
