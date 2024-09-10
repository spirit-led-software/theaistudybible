import { db } from '@/core/database';
import { LargeTranslationPicker } from '@/www/components/bible/reader/menu/translation-picker';
import { QueryBoundary } from '@/www/components/query-boundary';
import { useBibleStore } from '@/www/contexts/bible';
import { Title } from '@solidjs/meta';
import type { RouteDefinition } from '@solidjs/router';
import { Navigate } from '@solidjs/router';
import { createQuery, useQueryClient } from '@tanstack/solid-query';

async function getBibles() {
  'use server';
  return await db.query.bibles.findMany();
}

const biblesQueryOptions = {
  queryKey: ['bibles'],
  queryFn: () => getBibles(),
};

export const route: RouteDefinition = {
  preload: async () => {
    const qc = useQueryClient();
    await qc.prefetchQuery(biblesQueryOptions);
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

  const biblesQuery = createQuery(() => biblesQueryOptions);

  return (
    <div class="flex w-full flex-col p-5 text-center">
      <Title>Bible</Title>
      <QueryBoundary query={biblesQuery}>
        {(bibles) => <LargeTranslationPicker bibles={bibles} />}
      </QueryBoundary>
    </div>
  );
}
