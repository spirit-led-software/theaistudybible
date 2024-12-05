import { db } from '@/core/database';
import { QueryBoundary } from '@/www/components/query-boundary';
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
    where: (bibles, { eq }) => eq(bibles.id, bibleId),
    with: { chapters: { columns: {}, with: { chaptersToSourceDocuments: true } } },
  });
  if (!bibleData) {
    throw new Error(`Bible not found: ${bibleId}`);
  }
  return { hasReferences: bibleData.chapters.some((c) => c.chaptersToSourceDocuments.length) };
});

export const ReferencesButton = () => {
  const [brStore] = useBibleReaderStore();
  const { setValue } = useActivityPanel();

  const query = createQuery(() => ({
    queryKey: ['has-references', { bibleId: brStore.bible.id }],
    queryFn: () => getHasReferences(brStore.bible.id),
  }));

  return (
    <QueryBoundary
      query={query}
      loadingFallback={
        <Tooltip>
          <TooltipTrigger as={Button} size='icon' disabled>
            <TextSearch size={20} />
          </TooltipTrigger>
          <TooltipContent>Checking for references...</TooltipContent>
        </Tooltip>
      }
      errorFallback={(_, retry) => (
        <Tooltip>
          <TooltipTrigger as={Button} size='icon' onClick={retry}>
            <TextSearch size={20} class='text-error' />
          </TooltipTrigger>
          <TooltipContent>Error checking for references, try again.</TooltipContent>
        </Tooltip>
      )}
    >
      {({ hasReferences }) => (
        <Tooltip>
          <TooltipTrigger
            as={Button}
            size='icon'
            disabled={!hasReferences}
            onClick={() => setValue('references')}
          >
            <TextSearch size={20} />
          </TooltipTrigger>
          <TooltipContent>
            {hasReferences ? 'Find References' : 'Reference search is not available for this bible'}
          </TooltipContent>
        </Tooltip>
      )}
    </QueryBoundary>
  );
};
