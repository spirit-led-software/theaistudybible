import { useSearchParams } from '@solidjs/router';
import { createQuery } from '@tanstack/solid-query';
import { db } from '@theaistudybible/core/database';
import type { Content } from '@theaistudybible/core/types/bible';
import { createEffect } from 'solid-js';
import { createStore, reconcile } from 'solid-js/store';
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

async function getHighlights(chapterId: string) {
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

async function getNotes(chapterId: string) {
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
            notes: {
              where: (notes, { eq }) => eq(notes.userId, userId)
            }
          }
        }
      }
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

  const highlightsQuery = createQuery(() => ({
    queryKey: ['highlights', { chapterId: brStore.chapter.id }],
    queryFn: () => getHighlights(brStore.chapter.id)
  }));
  const [highlights, setHighlights] = createStore(
    highlightsQuery.data?.map(
      (hl) =>
        ({
          id: hl.id,
          verseId: hl.verseId,
          color: hl.color
        }) satisfies HighlightInfo
    ) || []
  );
  createEffect(() => {
    setHighlights(
      reconcile(
        highlightsQuery.data?.map(
          (hl) =>
            ({
              id: hl.id,
              verseId: hl.verseId,
              color: hl.color
            }) satisfies HighlightInfo
        ) || []
      )
    );
  });

  const notesQuery = createQuery(() => ({
    queryKey: ['notes', { chapterId: brStore.chapter.id }],
    queryFn: () => getNotes(brStore.chapter.id)
  }));
  const [notes, setNotes] = createStore(notesQuery.data || []);
  createEffect(() => {
    setNotes(reconcile(notesQuery.data || []));
  });

  return (
    <>
      <div class="eb-container mb-20 mt-5 w-full select-none">
        <Contents contents={props.contents} highlights={highlights} notes={notes} />
      </div>
      <ActivityPanel>
        <ActivityPanelAlwaysOpenButtons />
        <ActivityPanelButtons />
        <ActivityPanelContent />
      </ActivityPanel>
    </>
  );
};
