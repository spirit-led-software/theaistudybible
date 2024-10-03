import { LargeTranslationPicker } from '@/www/components/bible/reader/menu/translation-picker';
import { largeTranslationPickerQueryOptions } from '@/www/components/bible/reader/menu/translation-picker/large';
import { useBibleStore } from '@/www/contexts/bible';
import { WithHeaderLayout } from '@/www/layouts/with-header';
import { Meta, Title } from '@solidjs/meta';
import type { RouteDefinition } from '@solidjs/router';
import { Navigate } from '@solidjs/router';
import { useQueryClient } from '@tanstack/solid-query';

export const route: RouteDefinition = {
  preload: () => {
    const qc = useQueryClient();
    qc.prefetchQuery(largeTranslationPickerQueryOptions);
  },
};

export default function BiblePage() {
  const [bibleStore] = useBibleStore();
  if (bibleStore.bible && bibleStore.book && bibleStore.chapter) {
    if (bibleStore.verse) {
      return (
        <Navigate
          href={`/bible/${bibleStore.bible.abbreviation}/${bibleStore.book.code}/${bibleStore.chapter.number}/${bibleStore.verse.number}`}
        />
      );
    }
    return (
      <Navigate
        href={`/bible/${bibleStore.bible.abbreviation}/${bibleStore.book.code}/${bibleStore.chapter.number}`}
      />
    );
  }

  return (
    <WithHeaderLayout>
      <Title>Pick Your Translation | The AI Study Bible</Title>
      <Meta name='description' content='Pick your translation for The AI Study Bible' />
      <div class='flex w-full flex-col p-5 text-center'>
        <LargeTranslationPicker />
      </div>
    </WithHeaderLayout>
  );
}
