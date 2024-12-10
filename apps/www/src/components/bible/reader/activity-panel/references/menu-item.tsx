import { db } from '@/core/database';
import { QueryBoundary } from '@/www/components/query-boundary';
import { DropdownMenuItem } from '@/www/components/ui/dropdown-menu';
import { useBibleReaderStore } from '@/www/contexts/bible-reader';
import { GET } from '@solidjs/start';
import { createQuery } from '@tanstack/solid-query';
import { TextSearch } from 'lucide-solid';
import { useActivityPanel } from '../../activity-panel';

const getHasReferences = GET(async (bibleId: string) => {
  'use server';
  const bibleData = await db.query.bibles.findFirst({
    columns: {},
    where: (bibles, { eq }) => eq(bibles.id, bibleId),
    with: { chapters: { columns: {}, with: { chaptersToSourceDocuments: true } } },
  });
  if (!bibleData) {
    throw new Error(`Bible not found: ${bibleId}`);
  }
  return { hasReferences: bibleData.chapters.some((c) => c.chaptersToSourceDocuments.length) };
});

export type ReferencesMenuItemProps = {
  onSelect?: () => void;
};

export function ReferencesMenuItem(props: ReferencesMenuItemProps) {
  const [brStore] = useBibleReaderStore();
  const { setValue } = useActivityPanel();

  const query = createQuery(() => ({
    queryKey: ['has-references', { bibleId: brStore.bible.id }],
    queryFn: () => getHasReferences(brStore.bible.id),
  }));

  const DisabledMenuItem = () => (
    <DropdownMenuItem onSelect={props.onSelect} disabled>
      <TextSearch class='mr-2' />
      References
    </DropdownMenuItem>
  );

  return (
    <QueryBoundary
      query={query}
      loadingFallback={<DisabledMenuItem />}
      errorFallback={() => <DisabledMenuItem />}
    >
      {({ hasReferences }) => (
        <DropdownMenuItem
          disabled={!hasReferences}
          onSelect={() => {
            setValue('references');
            props.onSelect?.();
          }}
        >
          <TextSearch class='mr-2' />
          References
        </DropdownMenuItem>
      )}
    </QueryBoundary>
  );
}
