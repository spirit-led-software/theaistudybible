import { bookPickerQueryOptions } from '@/www/components/bible/reader/menu/chapter-picker/book';
import { smallTranslationPickerQueryOptions } from '@/www/components/bible/reader/menu/translation-picker/small';
import VerseReader, { getVerseReaderQueryOptions } from '@/www/components/bible/verse/reader';
import type { RouteDefinition } from '@solidjs/router';
import { useParams } from '@solidjs/router';
import { useQueryClient } from '@tanstack/solid-query';

export const route: RouteDefinition = {
  preload: ({ params }) => {
    const { bibleAbbr, bookAbbr } = params;
    const chapterNum = Number.parseInt(params.chapterNum);
    const verseNum = Number.parseInt(params.verseNum);

    const qc = useQueryClient();
    void Promise.all([
      qc.prefetchQuery(
        getVerseReaderQueryOptions({
          bibleAbbr,
          bookAbbr,
          chapterNum,
          verseNum,
        }),
      ),
      qc.prefetchQuery(bookPickerQueryOptions(bibleAbbr)),
      qc.prefetchQuery(smallTranslationPickerQueryOptions()),
    ]);
  },
};

export default function ChapterPage() {
  const params = useParams();

  const chapterNum = () => Number.parseInt(params.chapterNum);
  const verseNum = () => Number.parseInt(params.verseNum);

  return (
    <VerseReader
      bibleAbbr={params.bibleAbbr}
      bookAbbr={params.bookAbbr}
      chapterNum={chapterNum()}
      verseNum={verseNum()}
    />
  );
}
