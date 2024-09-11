import { db } from '@/core/database';
import type { Content } from '@/schemas/bibles/contents';
import type { SelectedVerseInfo } from '@/www/contexts/bible-reader';
import { useBibleReaderStore } from '@/www/contexts/bible-reader';
import { useReadingSessionContext } from '@/www/contexts/reading-session-context';
import { gatherElementIdsAndVerseNumberByVerseId } from '@/www/utils';
import { useSearchParams } from '@solidjs/router';
import { createQuery } from '@tanstack/solid-query';
import { auth } from 'clerk-solidjs/server';
import { createEffect, on } from 'solid-js';
import {
  ActivityPanel,
  ActivityPanelAlwaysOpenButtons,
  ActivityPanelButtons,
  ActivityPanelContent,
} from './activity-panel';
import Contents from './contents/contents';

import './contents/contents.css';

async function getHighlights(chapterId: string) {
  'use server';
  const { userId } = auth();
  if (!userId) {
    return [];
  }

  return await db.query.chapters
    .findFirst({
      where: (chapters, { eq }) => eq(chapters.id, chapterId),
      columns: {
        id: true,
      },
      with: {
        verses: {
          columns: {
            id: true,
          },
          with: {
            highlights: {
              where: (highlights, { eq }) => eq(highlights.userId, userId),
            },
          },
        },
      },
    })
    .then((chapter) => {
      return chapter?.verses.flatMap((verse) => verse.highlights) || [];
    });
}

async function getNotes(chapterId: string) {
  'use server';
  const { userId } = auth();
  if (!userId) {
    return [];
  }

  return await db.query.chapters
    .findFirst({
      where: (chapters, { eq }) => eq(chapters.id, chapterId),
      columns: {
        id: true,
      },
      with: {
        verses: {
          columns: {
            id: true,
          },
          with: {
            notes: {
              where: (notes, { eq }) => eq(notes.userId, userId),
            },
          },
        },
      },
    })
    .then((chapter) => {
      return chapter?.verses.flatMap((verse) => verse.notes) || [];
    });
}

export type ReaderContentProps = {
  contents: Content[];
};

export const ReaderContent = (props: ReaderContentProps) => {
  const [brStore, setBrStore] = useBibleReaderStore();
  const { updateActivity } = useReadingSessionContext();

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
            number: Number.parseInt(contents.verseNumber!),
            contentIds: contents.ids,
            text,
          };
        });

        return [...prev, ...newSelectedVerseInfos];
      });
      setSearchParams(
        { verseIds: undefined },
        {
          replace: true,
        },
      );
      document.getElementById(verseIds[0])?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  });

  const highlightsQuery = createQuery(() => ({
    queryKey: ['highlights', { chapterId: brStore.chapter.id }],
    queryFn: () => getHighlights(brStore.chapter.id),
    placeholderData: [],
  }));

  const notesQuery = createQuery(() => ({
    queryKey: ['notes', { chapterId: brStore.chapter.id }],
    queryFn: () => getNotes(brStore.chapter.id),
    placeholderData: [],
  }));

  // Any time the brStore changes, update the activity
  createEffect(
    on(
      () => ({
        ...brStore,
      }),
      () => {
        updateActivity();
      },
    ),
  );

  return (
    <>
      <div class='eb-container container select-none'>
        <Contents
          contents={props.contents}
          highlights={
            highlightsQuery.data?.map((hl) => ({
              id: hl.id,
              verseId: hl.verseId,
              color: hl.color,
            })) || []
          }
          notes={notesQuery.data}
        />
      </div>
      <ActivityPanel>
        <ActivityPanelAlwaysOpenButtons />
        <ActivityPanelButtons />
        <ActivityPanelContent />
      </ActivityPanel>
    </>
  );
};
