import './contents/contents.css';

import { db } from '@/core/database';
import type { Content } from '@/schemas/bibles/contents';
import { useBibleReaderStore } from '@/www/contexts/bible-reader';
import { auth } from '@/www/server/auth';
import { Meta, Title } from '@solidjs/meta';
import { useSearchParams } from '@solidjs/router';
import { GET } from '@solidjs/start';
import { createQuery } from '@tanstack/solid-query';
import { onMount } from 'solid-js';
import {
  ActivityPanel,
  ActivityPanelAlwaysOpenButtons,
  ActivityPanelButtons,
  ActivityPanelContent,
} from './reader/activity-panel';
import Contents from './reader/contents/contents';

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
  const [brStore] = useBibleReaderStore();

  const [searchParams] = useSearchParams();
  onMount(() => {
    if (!searchParams.verseId) {
      return;
    }

    const verseIds = Array.isArray(searchParams.verseId)
      ? searchParams.verseId
      : searchParams.verseId.split(',');
    if (!verseIds.length) {
      return;
    }

    document.getElementById(verseIds[0])?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
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
      <MetaTags />
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

const MetaTags = () => {
  const [brStore] = useBibleReaderStore();
  const title = () =>
    `${brStore.verse ? brStore.verse.name : brStore.chapter.name} | ${brStore.bible.abbreviationLocal} | The AI Study Bible - Read & Study the Bible with AI`;
  const description = () =>
    `Study ${brStore.verse ? brStore.verse.name : brStore.chapter.name} with AI-powered insights, commentary, and cross-references. Access multiple translations and study tools to deepen your understanding of Scripture.`;
  return (
    <>
      <Title>{title()}</Title>
      <Meta name='description' content={description()} />
      <Meta
        name='keywords'
        content={`${brStore.verse ? brStore.verse.name : brStore.chapter.name}, bible study, AI study bible, bible study tools, bible study notes, bible study annotations, bible study insights, bible study commentary, bible study cross-references`}
      />
      <Meta property='og:title' content={title()} />
      <Meta property='og:description' content={description()} />
      <Meta name='twitter:title' content={title()} />
      <Meta name='twitter:description' content={description()} />
    </>
  );
};
