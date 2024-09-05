import ChapterReader, { chapterReaderQueryOptions } from '@/www/components/bible/chapter/reader';
import { bookPickerQueryOptions } from '@/www/components/bible/reader/menu/chapter-picker/book';
import { smallTranslationPickerQueryOptions } from '@/www/components/bible/reader/menu/translation-picker/small';
import type { RouteDefinition} from '@solidjs/router';
import { useParams } from '@solidjs/router';
import { useQueryClient } from '@tanstack/solid-query';
import { Show } from 'solid-js';

export const route: RouteDefinition = {
  preload: ({ params }) => {
    const { bibleAbbr, bookAbbr } = params;
    const chapterNum = parseInt(params.chapterNum);

    const qc = useQueryClient();
    void Promise.all([
      qc.prefetchQuery(chapterReaderQueryOptions({ bibleAbbr, bookAbbr, chapterNum })),
      qc.prefetchQuery(bookPickerQueryOptions(bibleAbbr)),
      qc.prefetchQuery(smallTranslationPickerQueryOptions()),
    ]);
  },
};

export default function ChapterPage() {
  const params = useParams();

  return (
    <div class="relative flex flex-1 flex-col items-center">
      <Show when={params.chapterNum} keyed>
        <ChapterReader
          bibleAbbr={params.bibleAbbr}
          bookAbbr={params.bookAbbr}
          chapterNum={parseInt(params.chapterNum)}
        />
      </Show>
    </div>
  );
}
