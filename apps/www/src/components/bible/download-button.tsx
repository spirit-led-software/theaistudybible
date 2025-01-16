import { db } from '@/core/database';
import {
  bibleContributors as bibleContributorsTable,
  bibleCountries as bibleCountriesTable,
  bibleLanguages as bibleLanguagesTable,
  bibleRightsAdmins as bibleRightsAdminsTable,
  bibleRightsHolders as bibleRightsHoldersTable,
  bibles as biblesTable,
  biblesToContributors as biblesToContributorsTable,
  biblesToCountries as biblesToCountriesTable,
  biblesToLanguages as biblesToLanguagesTable,
  biblesToRightsAdmins as biblesToRightsAdminsTable,
  biblesToRightsHolders as biblesToRightsHoldersTable,
  books as booksTable,
  chapterBookmarks as chapterBookmarksTable,
  chapterNotes as chapterNotesTable,
  chapters as chaptersTable,
  chaptersToSourceDocuments as chaptersToSourceDocumentsTable,
  verseBookmarks as verseBookmarksTable,
  verseHighlights as verseHighlightsTable,
  verseNotes as verseNotesTable,
  verses as versesTable,
} from '@/core/database/schema';
import { useLocalDb } from '@/www/contexts/local-db';
import { createMutation, createQuery } from '@tanstack/solid-query';
import { eq } from 'drizzle-orm';
import { type JSX, splitProps } from 'solid-js';
import { QueryBoundary } from '../query-boundary';
import { Button, type ButtonProps } from '../ui/button';

export type BibleDownloadButtonProps = Omit<ButtonProps, 'onClick' | 'children'> & {
  bibleId: string;
  children?: ({
    hasDownloaded,
    isPending,
  }: { hasDownloaded: boolean; isPending: boolean }) => JSX.Element;
};

export const getBibleData = async (bibleId: string) => {
  'use server';
  const bibleData = await db().query.bibles.findFirst({
    where: (bible, { eq }) => eq(bible.id, bibleId),
    with: {
      biblesToContributors: { with: { contributor: true } },
      biblesToCountries: { with: { country: true } },
      biblesToLanguages: { with: { language: true } },
      biblesToRightsAdmins: { with: { rightsAdmin: true } },
      biblesToRightsHolders: { with: { rightsHolder: true } },
      books: true,
    },
  });
  if (!bibleData) throw new Error('Bible not found');
  const {
    biblesToContributors,
    biblesToCountries,
    biblesToLanguages,
    biblesToRightsAdmins,
    biblesToRightsHolders,
    books,
    ...bible
  } = bibleData;
  return {
    contributors: biblesToContributors.map(({ contributor }) => contributor),
    countries: biblesToCountries.map(({ country }) => country),
    languages: biblesToLanguages.map(({ language }) => language),
    rightsAdmins: biblesToRightsAdmins.map(({ rightsAdmin }) => rightsAdmin),
    rightsHolders: biblesToRightsHolders.map(({ rightsHolder }) => rightsHolder),
    books,
    bible,
  };
};

export const getChapters = async (
  bibleId: string,
  options: { limit?: number; offset?: number },
) => {
  'use server';
  const { limit = 100, offset = 0 } = options;
  const chapters = await db().query.chapters.findMany({
    where: (chapter, { eq }) => eq(chapter.bibleId, bibleId),
    with: { bookmarks: true, notes: true, chaptersToSourceDocuments: true },
    limit,
    offset,
  });
  return {
    chapters,
    nextCursor: chapters.length === limit ? offset + limit : undefined,
  };
};

export const getVerses = async (bibleId: string, options: { limit?: number; offset?: number }) => {
  'use server';
  const { limit = 100, offset = 0 } = options;
  const verses = await db().query.verses.findMany({
    where: (verse, { eq }) => eq(verse.bibleId, bibleId),
    with: { bookmarks: true, notes: true, highlights: true },
    limit,
    offset,
  });
  return {
    verses,
    nextCursor: verses.length === limit ? offset + limit : undefined,
  };
};

export function BibleDownloadButton(props: BibleDownloadButtonProps) {
  const [local, rest] = splitProps(props, ['bibleId', 'children']);

  const { db } = useLocalDb();

  const hasDownloadedBibleQuery = createQuery(() => ({
    queryKey: ['has-downloaded-bible', { bibleId: local.bibleId }],
    queryFn: async () => {
      const bible = await db()?.query.bibles.findFirst({
        where: (bible, { eq }) => eq(bible.id, local.bibleId),
      });
      return { hasDownloaded: !!bible };
    },
  }));

  const handleDownload = createMutation(() => ({
    mutationFn: async () => {
      const currentDb = db();
      if (!currentDb) throw new Error('Database not found');

      const { bible, books, contributors, countries, languages, rightsAdmins, rightsHolders } =
        await getBibleData(local.bibleId);
      await Promise.all([
        currentDb.insert(biblesTable).values(bible),
        currentDb.insert(booksTable).values(books),
        currentDb
          .insert(bibleContributorsTable)
          .values(contributors)
          .returning()
          .then(async (contributors) => {
            await currentDb.insert(biblesToContributorsTable).values(
              contributors.map((contributor) => ({
                bibleId: bible.id,
                contributorId: contributor.id,
              })),
            );
          }),
        currentDb
          .insert(bibleCountriesTable)
          .values(countries)
          .returning()
          .then(async (countries) => {
            await currentDb.insert(biblesToCountriesTable).values(
              countries.map((country) => ({
                bibleId: bible.id,
                countryId: country.id,
              })),
            );
          }),
        currentDb
          .insert(bibleLanguagesTable)
          .values(languages)
          .returning()
          .then(async (languages) => {
            await currentDb.insert(biblesToLanguagesTable).values(
              languages.map((language) => ({
                bibleId: bible.id,
                languageId: language.id,
              })),
            );
          }),
        currentDb
          .insert(bibleRightsAdminsTable)
          .values(rightsAdmins)
          .returning()
          .then(async (rightsAdmins) => {
            await currentDb.insert(biblesToRightsAdminsTable).values(
              rightsAdmins.map((rightsAdmin) => ({
                bibleId: bible.id,
                rightsAdminId: rightsAdmin.id,
              })),
            );
          }),
        currentDb
          .insert(bibleRightsHoldersTable)
          .values(rightsHolders)
          .returning()
          .then(async (rightsHolders) => {
            await currentDb.insert(biblesToRightsHoldersTable).values(
              rightsHolders.map((rightsHolder) => ({
                bibleId: bible.id,
                rightsHolderId: rightsHolder.id,
              })),
            );
          }),
      ]);
      let nextCursor: number | undefined = 0;
      while (nextCursor) {
        const chapterData = await getChapters(props.bibleId, { limit: 100, offset: nextCursor });
        nextCursor = chapterData.nextCursor;
        await Promise.all(
          chapterData.chapters.map(
            async ({ bookmarks, notes, chaptersToSourceDocuments, ...chapter }) => {
              await currentDb.insert(chaptersTable).values(chapter);
              await currentDb.insert(chapterBookmarksTable).values(bookmarks);
              await currentDb.insert(chapterNotesTable).values(notes);
              await currentDb
                .insert(chaptersToSourceDocumentsTable)
                .values(chaptersToSourceDocuments);
            },
          ),
        );
      }

      nextCursor = 0;
      while (nextCursor) {
        const verseData = await getVerses(props.bibleId, { limit: 100, offset: nextCursor });
        nextCursor = verseData.nextCursor;
        await Promise.all(
          verseData.verses.map(async ({ bookmarks, notes, highlights, ...verse }) => {
            await currentDb.insert(versesTable).values(verse);
            await currentDb.insert(verseBookmarksTable).values(bookmarks);
            await currentDb.insert(verseNotesTable).values(notes);
            await currentDb.insert(verseHighlightsTable).values(highlights);
          }),
        );
      }
    },
    onSettled: () => {
      hasDownloadedBibleQuery.refetch();
    },
  }));

  const handleDelete = createMutation(() => ({
    mutationFn: async () => {
      const currentDb = db();
      if (!currentDb) throw new Error('Database not found');
      await currentDb.delete(biblesTable).where(eq(biblesTable.id, local.bibleId));
    },
    onSettled: () => {
      hasDownloadedBibleQuery.refetch();
    },
  }));

  return (
    <QueryBoundary query={hasDownloadedBibleQuery}>
      {({ hasDownloaded }) => (
        <Button
          {...rest}
          disabled={!db() || handleDownload.isPending || handleDelete.isPending}
          onClick={() => {
            if (hasDownloaded) {
              handleDelete.mutate();
            } else {
              handleDownload.mutate();
            }
          }}
        >
          {local.children?.({
            hasDownloaded,
            isPending: handleDownload.isPending || handleDelete.isPending,
          }) ??
            (handleDownload.isPending
              ? hasDownloaded
                ? 'Deleting...'
                : 'Downloading...'
              : hasDownloaded
                ? 'Delete'
                : 'Download')}
        </Button>
      )}
    </QueryBoundary>
  );
}
