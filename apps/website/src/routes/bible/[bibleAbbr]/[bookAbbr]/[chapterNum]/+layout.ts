import type { LayoutLoad } from './$types';
import { getBible, getBibles, getBook, getBooks, getChapter } from './data';

export const load: LayoutLoad = async ({ params, parent }) => {
  const { bibleAbbr, bookAbbr, chapterNum } = params;
  const { queryClient, rpcClient } = await parent();

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: ['bibles'],
      queryFn: async () => await getBibles(rpcClient)
    }),
    queryClient.prefetchQuery({
      queryKey: ['bible', bibleAbbr],
      queryFn: async () => await getBible(rpcClient, bibleAbbr)
    }),
    queryClient.prefetchQuery({
      queryKey: ['books', bibleAbbr],
      queryFn: async () => await getBooks(rpcClient, bibleAbbr)
    }),
    queryClient.prefetchQuery({
      queryKey: ['book', bibleAbbr, bookAbbr],
      queryFn: async () => await getBook(rpcClient, bibleAbbr, bookAbbr)
    }),
    queryClient.prefetchQuery({
      queryKey: ['chapter', bibleAbbr, bookAbbr, chapterNum],
      queryFn: async () => await getChapter(rpcClient, bibleAbbr, bookAbbr, chapterNum)
    })
  ]);
};
