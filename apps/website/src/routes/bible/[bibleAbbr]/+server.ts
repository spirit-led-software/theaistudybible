import type { RouterType, RpcClient } from '$lib/types/rpc';
import { redirect } from '@sveltejs/kit';
import { hc } from 'hono/client';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, fetch }) => {
  const { bibleAbbr } = params;
  const rpcClient = hc<RouterType>('/api', {
    fetch
  }) as unknown as RpcClient;

  const books = await rpcClient.bibles[':id'].books
    .$get({
      param: {
        id: bibleAbbr
      },
      query: {
        limit: '1',
        sort: 'number:asc'
      }
    })
    .then(async (res) => {
      if (res.ok) {
        return (await res.json()).data;
      }
      return undefined;
    });

  if (!books) {
    return redirect(307, '/bible');
  }

  const chapters = await rpcClient.bibles[':id'].books[':bookId'].chapters
    .$get({
      param: {
        id: bibleAbbr,
        bookId: books[0].id
      },
      query: {
        limit: '1',
        sort: 'number:asc'
      }
    })
    .then(async (res) => {
      if (res.ok) {
        return (await res.json()).data;
      }
      return undefined;
    });

  if (!chapters) {
    return redirect(307, `/bible/${bibleAbbr}`);
  }

  const chapterParts = chapters[0].abbreviation.split('.');
  return redirect(302, `/bible/${bibleAbbr}/${chapterParts[0]}/${chapterParts[1]}`);
};
