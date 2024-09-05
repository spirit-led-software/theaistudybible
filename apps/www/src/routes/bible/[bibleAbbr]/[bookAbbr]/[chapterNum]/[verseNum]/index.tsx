import { bookPickerQueryOptions } from '@/www/components/bible/reader/menu/chapter-picker/book';
import { smallTranslationPickerQueryOptions } from '@/www/components/bible/reader/menu/translation-picker/small';
import VerseReader, { getVerseReaderQueryOptions } from '@/www/components/bible/verse/reader';
import type { RouteDefinition} from '@solidjs/router';
import { useParams } from '@solidjs/router';
import { useQueryClient } from '@tanstack/solid-query';
import { Show } from 'solid-js';

export const route: RouteDefinition = {
  preload: ({ params }) => {
    const { bibleAbbr, bookAbbr } = params;
    const chapterNum = parseInt(params.chapterNum);
    const verseNum = parseInt(params.verseNum);

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

  return (
    <div class="relative flex flex-1 flex-col items-center">
      <Show when={params.verseNum} keyed>
        <VerseReader
          bibleAbbr={params.bibleAbbr}
          bookAbbr={params.bookAbbr}
          chapterNum={parseInt(params.chapterNum)}
          verseNum={parseInt(params.verseNum)}
        />
      </Show>
    </div>
  );
}
