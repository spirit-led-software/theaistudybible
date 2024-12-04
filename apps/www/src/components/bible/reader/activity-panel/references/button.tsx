import { db } from '@/core/database';
import { Button } from '@/www/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/www/components/ui/tooltip';
import { useBibleReaderStore } from '@/www/contexts/bible-reader';
import { GET } from '@solidjs/start';
import { createQuery } from '@tanstack/solid-query';
import { TextSearch } from 'lucide-solid';
import { useActivityPanel } from '../../activity-panel';

const getHasReferences = GET(async (bibleId: string) => {
  'use server';
  const bibleData = await db.query.bibles.findFirst({
    columns: {},
    where: (table, { eq }) => eq(table.id, bibleId),
    with: {
      chapters: {
        columns: {},
        with: { chaptersToSourceDocuments: { limit: 1 } },
      },
    },
  });
  return {
    hasReferences: bibleData?.chapters.some((c) => c.chaptersToSourceDocuments.length > 0) ?? false,
  };
});

export const ReferencesButton = () => {
  const [brStore] = useBibleReaderStore();
  const { setValue } = useActivityPanel();

  const query = createQuery(() => ({
    queryKey: ['has-references', { bibleId: brStore.bible.id }],
    queryFn: () => getHasReferences(brStore.bible.id),
  }));

  return (
    <Tooltip>
      <TooltipTrigger
        as={Button}
        size='icon'
        disabled={
          query.status === 'pending' ||
          query.status === 'error' ||
          (query.status === 'success' && !query.data.hasReferences)
        }
        onClick={() => setValue('references')}
      >
        <TextSearch size={20} />
      </TooltipTrigger>
      <TooltipContent>
        {query.isLoading
          ? 'Checking for references...'
          : query.data
            ? 'Find References'
            : 'Reference search is not available for this bible'}
      </TooltipContent>
    </Tooltip>
  );
};
