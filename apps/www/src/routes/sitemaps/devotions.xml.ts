import { db } from '@/core/database';
import type { APIHandler } from '@solidjs/start/server';
import { XMLBuilder } from 'fast-xml-parser';

export const GET: APIHandler = async () => {
  const sitemapXmlBuilder = new XMLBuilder({
    ignoreAttributes: false,
    attributeNamePrefix: '$',
  });

  const devotions = await db.query.devotions.findMany({
    columns: { id: true },
  });

  const sitemapXml = sitemapXmlBuilder.build({
    urlset: {
      $xmlns: 'http://www.sitemaps.org/schemas/sitemap/0.9',
      url: devotions.map((devotion) => ({
        loc: `https://theaistudybible.com/devotion/${devotion.id}`,
      })),
    },
  });

  return new Response(sitemapXml, { status: 200, headers: { 'Content-Type': 'application/xml' } });
};
