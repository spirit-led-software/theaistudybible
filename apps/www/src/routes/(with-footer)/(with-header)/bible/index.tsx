import { LargeTranslationPicker } from '@/www/components/bible/reader/menu/translation-picker/large';
import { largeTranslationPickerQueryOptions } from '@/www/components/bible/reader/menu/translation-picker/large';
import { useBibleStore } from '@/www/contexts/bible';
import { Meta, Title } from '@solidjs/meta';
import type { RouteDefinition } from '@solidjs/router';
import { Navigate } from '@solidjs/router';
import { useQueryClient } from '@tanstack/solid-query';
import { Show } from 'solid-js';

export const route: RouteDefinition = {
  preload: () => {
    const qc = useQueryClient();
    qc.prefetchQuery(largeTranslationPickerQueryOptions);
  },
};

export default function BiblePage() {
  const [bibleStore] = useBibleStore();

  return (
    <Show
      when={bibleStore.bible && bibleStore.book && bibleStore.chapter}
      fallback={
        <>
          <MetaTags />
          <div class='flex w-full flex-col p-5 text-center'>
            <LargeTranslationPicker />
          </div>
        </>
      }
    >
      <Show
        when={bibleStore.verse}
        fallback={
          <Navigate
            href={`/bible/${bibleStore.bible!.abbreviation}/${bibleStore.book!.code}/${bibleStore.chapter!.number}`}
          />
        }
      >
        <Navigate
          href={`/bible/${bibleStore.bible!.abbreviation}/${bibleStore.book!.code}/${bibleStore.chapter!.number}/${bibleStore.verse!.number}`}
        />
      </Show>
    </Show>
  );
}

const MetaTags = () => {
  const title = 'Pick Your Bible Translation | The AI Study Bible - Access Scripture Anywhere';
  const description =
    'Choose from multiple Bible translations to start your personalized Scripture study experience. Access AI-powered insights, study tools, and in-depth analysis with The AI Study Bible.';

  return (
    <>
      <Title>{title}</Title>
      <Meta name='description' content={description} />
      <Meta property='og:title' content={title} />
      <Meta property='og:description' content={description} />
      <Meta name='twitter:card' content='summary' />
      <Meta name='twitter:title' content={title} />
      <Meta name='twitter:description' content={description} />
    </>
  );
};
