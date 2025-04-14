import { db } from '@/core/database';
import { QueryBoundary } from '@/www/components/query-boundary';
import { DropdownMenuItem } from '@/www/components/ui/dropdown-menu';
import { useBibleReaderStore } from '@/www/contexts/bible-reader';
import { useQuery } from '@tanstack/react-query';
import { createServerFn } from '@tanstack/react-start';
import { TextSearch } from 'lucide-react';
import { z } from 'zod';
import { useActivityPanel } from '..';

const getHasReferences = createServerFn({ method: 'GET' })
  .validator(z.object({ bibleAbbreviation: z.string() }))
  .handler(async ({ data: { bibleAbbreviation } }) => {
    const bibleData = await db.query.bibles.findFirst({
      columns: {},
      where: (bibles, { eq }) => eq(bibles.abbreviation, bibleAbbreviation),
      with: { chapters: { columns: {}, with: { chaptersToSourceDocuments: true } } },
    });
    if (!bibleData) {
      throw new Error(`Bible not found: ${bibleAbbreviation}`);
    }
    return { hasReferences: bibleData.chapters.some((c) => c.chaptersToSourceDocuments.length) };
  });

export type ReferencesMenuItemProps = {
  onSelect?: () => void;
};

export function ReferencesMenuItem(props: ReferencesMenuItemProps) {
  const brStore = useBibleReaderStore();
  const { setValue } = useActivityPanel();

  const query = useQuery({
    queryKey: ['has-references', { bibleAbbreviation: brStore.bible.abbreviation }],
    queryFn: () => getHasReferences({ data: { bibleAbbreviation: brStore.bible.abbreviation } }),
  });

  const DisabledMenuItem = () => (
    <DropdownMenuItem onSelect={props.onSelect} disabled>
      <TextSearch className='mr-2' />
      References
    </DropdownMenuItem>
  );

  return (
    <QueryBoundary
      query={query}
      loadingFallback={<DisabledMenuItem />}
      errorFallback={() => <DisabledMenuItem />}
      render={({ hasReferences }) => (
        <DropdownMenuItem
          disabled={!hasReferences}
          onSelect={() => {
            setValue('references');
            props.onSelect?.();
          }}
        >
          <TextSearch className='mr-2' />
          References
        </DropdownMenuItem>
      )}
    />
  );
}
