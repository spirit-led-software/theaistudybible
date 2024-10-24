import { db } from '@/core/database';
import { Button } from '@/www/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/www/components/ui/tooltip';
import { useBibleReaderStore } from '@/www/contexts/bible-reader';
import { GET } from '@solidjs/start';
import { createQuery } from '@tanstack/solid-query';
import { TextSearch } from 'lucide-solid';
import { useActivityPanel } from '../activity-panel';

const getHasReferences = GET(async (chapterId: string) => {
  'use server';
  const sourceDocs = await db.query.chaptersToSourceDocuments.findMany({
    where: (table, { eq }) => eq(table.chapterId, chapterId),
  });
  return { hasReferences: sourceDocs.length > 0 };
});

export const ReferencesButton = () => {
  const [brStore] = useBibleReaderStore();
  const { setValue } = useActivityPanel();

  const query = createQuery(() => ({
    queryKey: ['has-references', brStore.chapter.id],
    queryFn: () => getHasReferences(brStore.chapter.id),
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
