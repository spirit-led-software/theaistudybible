import { db } from '@/core/database';
import type { Content } from '@/schemas/bibles/contents';
import type { SelectedVerseInfo } from '@/www/contexts/bible-reader';
import { useBibleReaderStore } from '@/www/contexts/bible-reader';
import { auth } from '@/www/server/auth';
import { gatherElementIdsAndVerseNumberByVerseId } from '@/www/utils';
import { Title } from '@solidjs/meta';
import { useSearchParams } from '@solidjs/router';
import { GET } from '@solidjs/start';
import { createQuery } from '@tanstack/solid-query';
import { onMount } from 'solid-js';
import {
  ActivityPanel,
  ActivityPanelAlwaysOpenButtons,
  ActivityPanelButtons,
  ActivityPanelContent,
} from './activity-panel';
import Contents from './contents/contents';
import './contents/contents.css';

const getHighlights = GET(async (chapterId: string) => {
  'use server';
  const { user } = auth();
  if (!user) {
    return [];
  }

  return await db.query.chapters
    .findFirst({
      where: (chapters, { eq }) => eq(chapters.id, chapterId),
      columns: { id: true },
      with: {
        verses: {
          columns: { id: true },
          with: { highlights: { where: (highlights, { eq }) => eq(highlights.userId, user.id) } },
        },
      },
    })
    .then((chapter) => {
      return chapter?.verses.flatMap((verse) => verse.highlights) || [];
    });
});

const getNotes = GET(async (chapterId: string) => {
  'use server';
  const { user } = auth();
  if (!user) {
    return [];
  }

  return await db.query.chapters
    .findFirst({
      where: (chapters, { eq }) => eq(chapters.id, chapterId),
      columns: { id: true },
      with: {
        verses: {
          columns: { id: true },
          with: { notes: { where: (notes, { eq }) => eq(notes.userId, user.id) } },
        },
      },
    })
    .then((chapter) => {
      return chapter?.verses.flatMap((verse) => verse.notes) || [];
    });
});

export type ReaderContentProps = {
  contents: Content[];
};

export const ReaderContent = (props: ReaderContentProps) => {
  const [brStore, setBrStore] = useBibleReaderStore();

  const [searchParams] = useSearchParams();
  onMount(() => {
    const verseIdsParam = searchParams.verseIds;
    if (verseIdsParam) {
      const verseIds = Array.isArray(verseIdsParam) ? verseIdsParam : verseIdsParam.split(',');
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
      document.getElementById(verseIds[verseIds.length - 1])?.scrollIntoView({
        behavior: 'smooth',
        block: 'end',
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

  return (
    <>
      <Title>
        {brStore.verse ? brStore.verse.name : brStore.chapter.name} |{' '}
        {brStore.bible.abbreviationLocal} | The AI Study Bible
      </Title>
      <div class='eb-container w-full select-none'>
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
