import type { RouterType, RpcClient } from '$lib/types/rpc';
import { redirect } from '@sveltejs/kit';
import { hc } from 'hono/client';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, fetch }) => {
  const { bibleAbbr, bookAbbr } = params;
  const rpcClient = hc<RouterType>('/api', {
    fetch
  }) as unknown as RpcClient;

  const chapters = await rpcClient.bibles[':id'].books[':bookId'].chapters
    .$get({
      param: {
        id: bibleAbbr,
        bookId: bookAbbr
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

  return redirect(302, `/bible/${bibleAbbr}/${bookAbbr}/${chapters[0].number}`);
};
