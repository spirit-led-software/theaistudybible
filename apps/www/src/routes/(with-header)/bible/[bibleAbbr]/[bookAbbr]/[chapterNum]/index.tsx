import ChapterReader, { chapterReaderQueryOptions } from '@/www/components/bible/chapter/reader';
import { bookPickerQueryOptions } from '@/www/components/bible/reader/menu/chapter-picker/book';
import { smallTranslationPickerQueryOptions } from '@/www/components/bible/reader/menu/translation-picker/small';
import type { RouteDefinition } from '@solidjs/router';
import { useParams } from '@solidjs/router';
import { useQueryClient } from '@tanstack/solid-query';

export const route: RouteDefinition = {
  preload: async ({ params }) => {
    const { bibleAbbr, bookAbbr } = params;
    const chapterNum = parseInt(params.chapterNum);

    const qc = useQueryClient();
    await Promise.all([
      qc.prefetchQuery(chapterReaderQueryOptions({ bibleAbbr, bookAbbr, chapterNum })),
      qc.prefetchQuery(bookPickerQueryOptions(bibleAbbr)),
      qc.prefetchQuery(smallTranslationPickerQueryOptions()),
    ]);
  },
};

export default function ChapterPage() {
  const params = useParams();

  const chapterNum = () => parseInt(params.chapterNum);

  return (
    <ChapterReader
      bibleAbbr={params.bibleAbbr}
      bookAbbr={params.bookAbbr}
      chapterNum={chapterNum()}
    />
  );
}
