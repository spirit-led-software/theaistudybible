import { PUBLIC_AUTH_URL, PUBLIC_WEBSITE_URL } from '$env/static/public';
import { getDevotions } from '@revelationsai/server/services/devotion';
import { XMLBuilder } from 'fast-xml-parser';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	const devotions = await getDevotions({ limit: Number.MAX_SAFE_INTEGER });

	const sitemapXml = new XMLBuilder({
		ignoreAttributes: false
	}).build({
		urlset: {
			'@_xmlns': 'http://www.sitemaps.org/schemas/sitemap/0.9',
			url: [
				{
					loc: `${PUBLIC_WEBSITE_URL}`
				},
				{
					loc: `${PUBLIC_WEBSITE_URL}/chat`
				},
				{
					loc: `${PUBLIC_WEBSITE_URL}/search`
				},
				{
					loc: `${PUBLIC_WEBSITE_URL}/devotions`
				},
				{
					loc: `${PUBLIC_WEBSITE_URL}/privacy-policy`
				},
				{
					loc: `${PUBLIC_AUTH_URL}/sign-in`
				},
				{
					loc: `${PUBLIC_AUTH_URL}/sign-up`
				},
				{
					loc: `${PUBLIC_AUTH_URL}/forgot-password`
				},
				...devotions.map((devotion) => ({
					loc: `${PUBLIC_WEBSITE_URL}/devotions/${devotion.id}`
				}))
			]
		}
	});

	return new Response(`<?xml version="1.0" encoding="UTF-8"?>${sitemapXml}`, {
		status: 200,
		headers: { 'Content-Type': 'text/xml' }
	});
};
