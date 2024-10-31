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

  const bibles = await db.query.bibles.findMany({
    columns: { abbreviation: true },
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
      ],
      sitemap: bibles.map((bible) => ({
        loc: `https://theaistudybible.com/sitemaps/${bible.abbreviation}.xml`,
      })),
    },
  });

  return new Response(sitemapXml, { status: 200, headers: { 'Content-Type': 'application/xml' } });
};
