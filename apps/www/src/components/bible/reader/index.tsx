import { db } from '@/core/database';
import type { Content } from '@/schemas/bibles/contents';
import { useBibleReaderStore } from '@/www/contexts/bible-reader';
import { auth } from '@/www/server/auth';
import { gatherElementIdsByVerseNumber } from '@/www/utils';
import { Meta, Title } from '@solidjs/meta';
import { useSearchParams } from '@solidjs/router';
import { GET } from '@solidjs/start';
import { createQuery } from '@tanstack/solid-query';
import { createMemo, onMount } from 'solid-js';
import { ActivityPanel, ActivityPanelContent, ActivityPanelMenu } from './activity-panel';
import { Contents } from './contents';

import './contents/contents.css';

const getHighlights = GET(async (bibleAbbreviation: string, chapterCode: string) => {
  'use server';
  const { user } = auth();
  if (!user) {
    return { highlights: [] };
  }

  const highlights = await db.query.chapters
    .findFirst({
      where: (chapters, { and, eq }) =>
        and(eq(chapters.bibleAbbreviation, bibleAbbreviation), eq(chapters.code, chapterCode)),
      columns: { code: true },
      with: {
        verses: {
          columns: { code: true },
          with: { highlights: { where: (highlights, { eq }) => eq(highlights.userId, user.id) } },
        },
      },
    })
    .then((chapter) => {
      return chapter?.verses.flatMap((verse) => verse.highlights) || [];
    });

  return { highlights };
});

const getNotes = GET(async (bibleAbbreviation: string, chapterCode: string) => {
  'use server';
  const { user } = auth();
  if (!user) {
    return { notes: [] };
  }

  const notes = await db.query.chapters
    .findFirst({
      where: (chapters, { and, eq }) =>
        and(eq(chapters.bibleAbbreviation, bibleAbbreviation), eq(chapters.code, chapterCode)),
      columns: { code: true },
      with: {
        verses: {
          columns: { code: true },
          with: { notes: { where: (notes, { eq }) => eq(notes.userId, user.id) } },
        },
      },
    })
    .then((chapter) => chapter?.verses.flatMap((verse) => verse.notes) || []);

  return { notes };
});

const textSizeToFontVarMap = {
  xs: '0.75rem',
  sm: '0.875rem',
  md: '1rem',
  lg: '1.125rem',
  xl: '1.25rem',
  '2xl': '1.5rem',
  '3xl': '1.875rem',
  '4xl': '2.25rem',
};

export type ReaderContentProps = {
  contents: Content[];
};

export const ReaderContent = (props: ReaderContentProps) => {
  const [brStore] = useBibleReaderStore();

  const [searchParams] = useSearchParams();
  onMount(() => {
    if (!searchParams.verseNumber) return;

    if (searchParams.verseNumber) {
      const verseNumbers = Array.isArray(searchParams.verseNumber)
        ? searchParams.verseNumber
        : searchParams.verseNumber.split(',');
      if (!verseNumbers.length) return;

      const ids = gatherElementIdsByVerseNumber(Number(verseNumbers[0]));
      if (ids.length) {
        document.getElementById(ids[0])?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  });

  const highlightsQuery = createQuery(() => ({
    queryKey: [
      'highlights',
      { bibleAbbreviation: brStore.bible.abbreviation, chapterCode: brStore.chapter.code },
    ],
    queryFn: () => getHighlights(brStore.bible.abbreviation, brStore.chapter.code),
    placeholderData: { highlights: [] },
  }));

  const notesQuery = createQuery(() => ({
    queryKey: [
      'notes',
      { bibleAbbreviation: brStore.bible.abbreviation, chapterCode: brStore.chapter.code },
    ],
    queryFn: () => getNotes(brStore.bible.abbreviation, brStore.chapter.code),
    placeholderData: { notes: [] },
  }));

  return (
    <>
      <MetaTags />
      <div
        class='eb-container w-full select-none'
        style={{ '--br-textsize': textSizeToFontVarMap[brStore.textSize ?? 'md'] }}
      >
        <Contents
          contents={props.contents}
          highlights={
            highlightsQuery.data?.highlights.map((hl) => ({
              bibleAbbreviation: hl.bibleAbbreviation,
              verseCode: hl.verseCode,
              color: hl.color,
            })) || []
          }
          notes={notesQuery.data?.notes}
        />
      </div>
      <ActivityPanel>
        <ActivityPanelMenu />
        <ActivityPanelContent />
      </ActivityPanel>
    </>
  );
};

const MetaTags = () => {
  const [brStore] = useBibleReaderStore();
  const title = createMemo(
    () =>
      `${brStore.verse ? brStore.verse.name : brStore.chapter.name} | ${brStore.bible.abbreviationLocal} | The AI Study Bible - Read & Study the Bible with AI`,
  );
  const description = createMemo(
    () =>
      `Study ${brStore.verse ? brStore.verse.name : brStore.chapter.name} with AI-powered insights, commentary, and cross-references. Access multiple translations and study tools to deepen your understanding of Scripture.`,
  );
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
