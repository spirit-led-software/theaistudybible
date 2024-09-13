import { LargeTranslationPicker } from '@/www/components/bible/reader/menu/translation-picker';
import { largeTranslationPickerQueryOptions } from '@/www/components/bible/reader/menu/translation-picker/large';
import { useBibleStore } from '@/www/contexts/bible';
import { Title } from '@solidjs/meta';
import type { RouteDefinition } from '@solidjs/router';
import { Navigate } from '@solidjs/router';
import { useQueryClient } from '@tanstack/solid-query';

export const route: RouteDefinition = {
  preload: () => {
    const qc = useQueryClient();
    void qc.prefetchQuery(largeTranslationPickerQueryOptions);
  },
};

export default function BiblePage() {
  const [bibleStore] = useBibleStore();
  if (bibleStore.bible && bibleStore.book && bibleStore.chapter) {
    if (bibleStore.verse) {
      return (
        <Navigate
          href={`/bible/${bibleStore.bible.abbreviation}/${bibleStore.book.abbreviation}/${bibleStore.chapter.number}/${bibleStore.verse.number}`}
        />
      );
    }
    return (
      <Navigate
        href={`/bible/${bibleStore.bible.abbreviation}/${bibleStore.book.abbreviation}/${bibleStore.chapter.number}`}
      />
    );
  }

  return (
    <div class='flex w-full flex-col p-5 text-center'>
      <Title>Bible</Title>
      <LargeTranslationPicker />
    </div>
  );
}
