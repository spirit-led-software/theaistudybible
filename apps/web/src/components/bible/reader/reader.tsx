import { createQuery } from '@tanstack/solid-query';
import type { Content } from '@theaistudybible/core/types/bible';
import { createEffect, createMemo } from 'solid-js';
import { SelectedVerseInfo, useBibleReaderStore } from '~/components/providers/bible-reader';
import { HighlightInfo } from '~/types/bible';
import {
  ActivityPanel,
  ActivityPanelButtons,
  ActivityPanelChatButton,
  ActivityPanelContent
} from './activity-panel';
import Contents from './contents/contents';
import { getHighlights } from './server';

import { useSearchParams } from '@solidjs/router';
import { gatherElementIdsAndVerseNumberByVerseId } from '~/lib/utils';
import './contents/contents.css';

export type ReaderContentProps = {
  contents: Content[];
};

export const getHighlightsQueryOptions = (props: { chapterId: string }) => ({
  queryKey: ['highlights', props],
  queryFn: () => getHighlights(props)
});

export const ReaderContent = (props: ReaderContentProps) => {
  const [brStore, setBrStore] = useBibleReaderStore();

  const [searchParams, setSearchParams] = useSearchParams();
  createEffect(() => {
    const verseIdsParam = searchParams.verseIds;
    if (verseIdsParam) {
      const verseIds = verseIdsParam.split(',');
      setBrStore('selectedVerseInfos', (prev) => {
        const newSelectedVerseInfos: SelectedVerseInfo[] = verseIds.map((id) => {
          const contents = gatherElementIdsAndVerseNumberByVerseId(id);
          const text = contents.ids
            .map((id) => document.getElementById(id)?.textContent)
            .join('')
            .trim();
          return {
            id,
            number: parseInt(contents.verseNumber!),
            contentIds: contents.ids,
            text
          };
        });

        return [...prev, ...newSelectedVerseInfos];
      });
      setSearchParams({ verseIds: undefined });
      document.getElementById(verseIds[0])?.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  });

  const highlightsQuery = createQuery(() =>
    getHighlightsQueryOptions({ chapterId: brStore.chapter!.id })
  );

  const highlights = createMemo(() => {
    let highlights = [] as HighlightInfo[];
    if (highlightsQuery.data) {
      highlights = highlights.concat(
        highlightsQuery.data.map((hl) => ({
          id: hl.id,
          verseId: hl.verseId,
          color: hl.color
        }))
      );
    }
    return highlights;
  });

  return (
    <>
      <div class="eb-container mb-20 mt-5 w-full select-none">
        <Contents contents={props.contents} highlights={highlights} />
      </div>
      <ActivityPanel>
        <ActivityPanelChatButton />
        <ActivityPanelButtons />
        <ActivityPanelContent />
      </ActivityPanel>
    </>
  );
};
