import ChapterReader, { chapterReaderQueryOptions } from '@/www/components/bible/chapter/reader';
import { bookPickerQueryOptions } from '@/www/components/bible/reader/menu/chapter-picker/book';
import { smallTranslationPickerQueryOptions } from '@/www/components/bible/reader/menu/translation-picker/small';
import BibleReaderLayout from '@/www/layouts/bible-reader';
import type { RouteDefinition } from '@solidjs/router';
import { useParams } from '@solidjs/router';
import { useQueryClient } from '@tanstack/solid-query';

export const route: RouteDefinition = {
  preload: async ({ params }) => {
    const { bibleAbbr, bookCode } = params;
    const chapterNum = Number.parseInt(params.chapterNum);

    const qc = useQueryClient();
    await Promise.all([
      qc.prefetchQuery(chapterReaderQueryOptions({ bibleAbbr, bookCode, chapterNum })),
      qc.prefetchQuery(bookPickerQueryOptions(bibleAbbr)),
      qc.prefetchQuery(smallTranslationPickerQueryOptions()),
    ]);
  },
};

export default function ChapterPage() {
  const params = useParams();

  const chapterNum = () => Number.parseInt(params.chapterNum);

  return (
    <BibleReaderLayout>
      <ChapterReader
        bibleAbbr={params.bibleAbbr}
        bookCode={params.bookCode}
        chapterNum={chapterNum()}
      />
    </BibleReaderLayout>
  );
}
