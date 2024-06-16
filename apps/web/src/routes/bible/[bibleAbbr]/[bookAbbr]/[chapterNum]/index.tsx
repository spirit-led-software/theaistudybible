import { RouteDefinition, useParams } from '@solidjs/router';
import { useQueryClient } from '@tanstack/solid-query';
import { Show } from 'solid-js';
import ChapterReader, { chapterReaderQueryOptions } from '~/components/bible/chapter/reader';
import { bookPickerQueryOptions } from '~/components/bible/reader/menu/chapter-picker/book';
import { smallTranslationPickerQueryOptions } from '~/components/bible/reader/menu/translation-picker/small';

export const route: RouteDefinition = {
  load: async ({ params }) => {
    const { bibleAbbr, bookAbbr } = params;
    const chapterNum = parseInt(params.chapterNum);

    const qc = useQueryClient();
    await Promise.all([
      qc.prefetchQuery(chapterReaderQueryOptions({ bibleAbbr, bookAbbr, chapterNum })),
      qc.prefetchQuery(bookPickerQueryOptions(bibleAbbr)),
      qc.prefetchQuery(smallTranslationPickerQueryOptions())
    ]);
  }
};

export default function ChapterPage() {
  const params = useParams();

  return (
    <div class="relative flex flex-1 flex-col px-16 py-5 md:px-20 lg:px-36 xl:px-48">
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
