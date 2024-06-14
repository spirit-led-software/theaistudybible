import { createQuery } from '@tanstack/solid-query';
import type { Content } from '@theaistudybible/core/types/bible';
import { createMemo } from 'solid-js';
import { useBibleReaderStore } from '~/components/providers/bible-reader';
import {
  ActivityPanel,
  ActivityPanelButtons,
  ActivityPanelChatButton,
  ActivityPanelContent
} from './activity-panel';
import Contents from './contents/contents';
import { getHighlights } from './server';

import './contents/contents.css';

export type ReaderContentProps = {
  contents: Content[];
};

export const getHighlightsQueryOptions = ({ chapterId }: { chapterId: string }) => ({
  queryKey: ['highlights', { chapterId }],
  queryFn: () => getHighlights({ chapterId })
});

export const ReaderContent = (props: ReaderContentProps) => {
  const [bibleReaderStore] = useBibleReaderStore();

  const highlightsQuery = createQuery(() =>
    getHighlightsQueryOptions({ chapterId: bibleReaderStore.chapter!.id })
  );

  const highlights = createMemo(() => {
    let highlights = [] as {
      id: string;
      color: string;
    }[];
    if (highlightsQuery.data) {
      highlights = highlights.concat(
        highlightsQuery.data.map((hl) => ({
          id: hl.id,
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
