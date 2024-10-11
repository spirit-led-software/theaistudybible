import { bookPickerQueryOptions } from '@/www/components/bible/reader/menu/chapter-picker/book';
import { smallTranslationPickerQueryOptions } from '@/www/components/bible/reader/menu/translation-picker/small';
import VerseReader, { getVerseReaderQueryOptions } from '@/www/components/bible/verse/reader';
import { BibleReaderLayout } from '@/www/layouts/bible-reader';
import type { RouteDefinition } from '@solidjs/router';
import { useParams } from '@solidjs/router';
import { useQueryClient } from '@tanstack/solid-query';

export const route: RouteDefinition = {
  preload: ({ params }) => {
    const { bibleAbbr, bookCode } = params;
    const chapterNum = Number.parseInt(params.chapterNum);
    const verseNum = Number.parseInt(params.verseNum);

    const qc = useQueryClient();
    Promise.all([
      qc.prefetchQuery(
        getVerseReaderQueryOptions({
          bibleAbbr,
          bookCode,
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
    <BibleReaderLayout>
      <VerseReader
        bibleAbbr={params.bibleAbbr}
        bookCode={params.bookCode}
        chapterNum={chapterNum()}
        verseNum={verseNum()}
      />
    </BibleReaderLayout>
  );
}
