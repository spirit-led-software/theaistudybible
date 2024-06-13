import { RouteDefinition, useParams } from '@solidjs/router';
import { useQueryClient } from '@tanstack/solid-query';
import { Show } from 'solid-js';
import { BookPicker } from '~/components/bible/chapter-picker';
import { bookPickerQueryOptions } from '~/components/bible/chapter-picker/book';
import { SmallTranslationPicker } from '~/components/bible/translation-picker';
import { smallTranslationPickerQueryOptions } from '~/components/bible/translation-picker/small';
import VerseReader from '~/components/bible/verse/reader';

export const route: RouteDefinition = {
  load: async ({ params }) => {
    const { bibleAbbr, bookAbbr } = params;
    const chapterNum = parseInt(params.chapterNum);

    const qc = useQueryClient();
    await Promise.all([
      qc.prefetchQuery(bookPickerQueryOptions({ bibleAbbr, bookAbbr, chapterNum })),
      qc.prefetchQuery(smallTranslationPickerQueryOptions({ bibleAbbr, bookAbbr, chapterNum }))
    ]);
  }
};

export default function ChapterPage() {
  const params = useParams();

  return (
    <div class="relative flex h-full w-full flex-col justify-center px-16 py-5 md:px-20 lg:px-36 xl:px-48">
      <div class="flex h-full w-full flex-col overflow-hidden">
        <div class="flex w-full space-x-2">
          <BookPicker
            bibleAbbr={params.bibleAbbr}
            bookAbbr={params.bookAbbr}
            chapterNum={parseInt(params.chapterNum)}
          />
          <SmallTranslationPicker
            bibleAbbr={params.bibleAbbr}
            bookAbbr={params.bookAbbr}
            chapterNum={parseInt(params.chapterNum)}
          />
        </div>
        <Show when={params.verseNum} keyed>
          <VerseReader
            bibleAbbr={params.bibleAbbr}
            bookAbbr={params.bookAbbr}
            chapterNum={parseInt(params.chapterNum)}
            verseNum={parseInt(params.verseNum)}
          />
        </Show>
      </div>
    </div>
  );
}
