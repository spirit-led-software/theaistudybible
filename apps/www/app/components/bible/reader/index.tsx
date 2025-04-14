import { db } from '@/core/database';
import type { Content } from '@/schemas/bibles/contents';
import { useBibleReaderStore } from '@/www/contexts/bible-reader';
import { cn } from '@/www/lib/utils';
import { authMiddleware } from '@/www/server/middleware/auth';
import { gatherElementIdsByVerseNumber } from '@/www/utils';
import { useQuery } from '@tanstack/react-query';
import { useSearch } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { useEffect } from 'react';
import { z } from 'zod';
import { ActivityPanel, ActivityPanelContent, ActivityPanelMenu } from './activity-panel';
import { Contents } from './contents';

import './contents/contents.css';

const getHighlights = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator(z.object({ bibleAbbreviation: z.string(), chapterCode: z.string() }))
  .handler(async ({ context, data }) => {
    if (!context.user) {
      return { highlights: [] };
    }

    const highlights = await db.query.chapters
      .findFirst({
        where: (chapters, { and, eq }) =>
          and(
            eq(chapters.bibleAbbreviation, data.bibleAbbreviation),
            eq(chapters.code, data.chapterCode),
          ),
        columns: { code: true },
        with: {
          verses: {
            columns: { code: true, number: true },
            with: {
              highlights: {
                where: (highlights, { eq }) => eq(highlights.userId, context.user!.id),
              },
            },
          },
        },
      })
      .then((chapter) => {
        return (
          chapter?.verses.flatMap((verse) =>
            verse.highlights.map((hl) => ({
              ...hl,
              verseNumber: verse.number,
            })),
          ) || []
        );
      });

    return { highlights };
  });

const getNotes = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator(z.object({ bibleAbbreviation: z.string(), chapterCode: z.string() }))
  .handler(async ({ context, data }) => {
    if (!context.user) {
      return { notes: [] };
    }

    const notes = await db.query.chapters
      .findFirst({
        where: (chapters, { and, eq }) =>
          and(
            eq(chapters.bibleAbbreviation, data.bibleAbbreviation),
            eq(chapters.code, data.chapterCode),
          ),
        columns: { code: true },
        with: {
          verses: {
            columns: { code: true },
            with: { notes: { where: (notes, { eq }) => eq(notes.userId, context.user!.id) } },
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

const textSizeToLeadingMap = {
  xs: 'leading-6',
  sm: 'leading-7',
  md: 'leading-9',
  lg: 'leading-10',
  xl: 'leading-11',
  '2xl': 'leading-12',
  '3xl': 'leading-13',
  '4xl': 'leading-14',
};

export type ReaderContentProps = {
  contents: Content[];
};

export const ReaderContent = (props: ReaderContentProps) => {
  const brStore = useBibleReaderStore((state) => ({
    bible: state.bible,
    chapter: state.chapter,
    textSize: state.textSize,
  }));

  const search = useSearch({ strict: false });
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const verseNumbers = search.verseNumbers;
    if (verseNumbers?.length) {
      const ids = gatherElementIdsByVerseNumber(Number(verseNumbers[0]));
      if (ids.length) {
        document.getElementById(ids[0])?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [search.verseNumbers]);

  const highlightsQuery = useQuery({
    queryKey: [
      'highlights',
      { bibleAbbreviation: brStore.bible.abbreviation, chapterCode: brStore.chapter.code },
    ],
    queryFn: () =>
      getHighlights({
        data: { bibleAbbreviation: brStore.bible.abbreviation, chapterCode: brStore.chapter.code },
      }),
    placeholderData: { highlights: [] },
  });

  const notesQuery = useQuery({
    queryKey: [
      'notes',
      { bibleAbbreviation: brStore.bible.abbreviation, chapterCode: brStore.chapter.code },
    ],
    queryFn: () =>
      getNotes({
        data: { bibleAbbreviation: brStore.bible.abbreviation, chapterCode: brStore.chapter.code },
      }),
    placeholderData: { notes: [] },
  });

  return (
    <>
      <div
        className={cn(
          'eb-container container w-full select-none',
          textSizeToLeadingMap[brStore.textSize ?? 'md'],
        )}
        style={
          { '--br-textsize': textSizeToFontVarMap[brStore.textSize ?? 'md'] } as React.CSSProperties
        }
      >
        <Contents
          contents={props.contents}
          highlights={
            highlightsQuery.data?.highlights.map((hl) => ({
              bibleAbbreviation: hl.bibleAbbreviation,
              verseNumber: hl.verseNumber,
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
