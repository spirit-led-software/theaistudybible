import { db } from '@lib/server/database';
import { Title } from '@solidjs/meta';
import { Navigate, RouteDefinition } from '@solidjs/router';
import { createQuery, useQueryClient } from '@tanstack/solid-query';
import { LargeTranslationPicker } from '~/components/bible/reader/menu/translation-picker';
import { useBibleStore } from '~/components/providers/bible';
import { QueryBoundary } from '~/components/query-boundary';

async function getBibles() {
  'use server';
  return await db.query.bibles.findMany();
}

const biblesQueryOptions = {
  queryKey: ['bibles'],
  queryFn: () => getBibles()
};

export const route: RouteDefinition = {
  load: async () => {
    const qc = useQueryClient();
    await qc.prefetchQuery(biblesQueryOptions);
  }
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
