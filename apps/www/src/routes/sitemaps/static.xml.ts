import type { APIHandler } from '@solidjs/start/server';
import { XMLBuilder } from 'fast-xml-parser';

export const GET: APIHandler = () => {
  const sitemapXmlBuilder = new XMLBuilder({
    ignoreAttributes: false,
    attributeNamePrefix: '$',
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
      ],
    },
  });

  return Promise.resolve(
    new Response(sitemapXml, { status: 200, headers: { 'Content-Type': 'application/xml' } }),
  );
};
