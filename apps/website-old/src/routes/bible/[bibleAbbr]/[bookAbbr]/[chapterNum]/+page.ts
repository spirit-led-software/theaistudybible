import type { PageLoad } from './$types';
import { getChapterHighlights } from './data';

export const load: PageLoad = async ({ params, parent }) => {
  const { bibleAbbr, bookAbbr, chapterNum } = params;
  const { queryClient, rpcClient } = await parent();

  await queryClient.prefetchQuery({
    queryKey: ['chapter-highlights', bibleAbbr, bookAbbr, chapterNum],
    queryFn: async () => await getChapterHighlights(rpcClient, bibleAbbr, bookAbbr, chapterNum)
  });
};
