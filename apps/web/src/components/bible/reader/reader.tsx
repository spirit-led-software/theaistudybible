import { useSearchParams } from '@solidjs/router';
import { createQuery } from '@tanstack/solid-query';
import { db } from '@theaistudybible/core/database';
import type { Content } from '@theaistudybible/core/types/bible';
import { createEffect, createMemo } from 'solid-js';
import { SelectedVerseInfo, useBibleReaderStore } from '~/components/providers/bible-reader';
import { auth } from '~/lib/server/clerk';
import { gatherElementIdsAndVerseNumberByVerseId } from '~/lib/utils';
import { HighlightInfo } from '~/types/bible';
import {
  ActivityPanel,
  ActivityPanelAlwaysOpenButtons,
  ActivityPanelButtons,
  ActivityPanelContent
} from './activity-panel';
import Contents from './contents/contents';

import './contents/contents.css';

export type ReaderContentProps = {
  contents: Content[];
};

async function getHighlights({ chapterId }: { chapterId: string }) {
  'use server';
  const { isSignedIn, userId } = auth();
  if (!isSignedIn) {
    return [];
  }

  return await db.query.chapters
    .findFirst({
      where: (chapters, { eq }) => eq(chapters.id, chapterId),
      columns: {
        id: true
      },
      with: {
        verses: {
          columns: {
            id: true
          },
          with: {
            highlights: {
              where: (highlights, { eq }) => eq(highlights.userId, userId)
            }
          }
        }
      }
    })
    .then((chapter) => {
      return chapter?.verses.flatMap((verse) => verse.highlights) || [];
    });
}

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
      setSearchParams(
        { verseIds: undefined },
        {
          replace: true
        }
      );
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
    return (
      highlightsQuery.data?.map(
        (hl) =>
          ({
            id: hl.id,
            verseId: hl.verseId,
            color: hl.color
          }) satisfies HighlightInfo
      ) || []
    );
  });

  return (
    <>
      <div class="eb-container mb-20 mt-5 w-full select-none">
        <Contents contents={props.contents} highlights={highlights} />
      </div>
      <ActivityPanel>
        <ActivityPanelAlwaysOpenButtons />
        <ActivityPanelButtons />
        <ActivityPanelContent />
      </ActivityPanel>
    </>
  );
};
