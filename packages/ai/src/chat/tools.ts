import { db } from '@theaistudybible/core/database';
import {
  chapterBookmarks,
  verseBookmarks,
  verseHighlights
} from '@theaistudybible/core/database/schema';
import { tool } from 'ai';
import { z } from 'zod';
import { vectorStore } from '../vector-store';

export const askForConfirmationTool = tool({
  description: 'Ask the user for confirmation to use a tool.',
  parameters: z.object({
    message: z.string().describe('The message you want to ask the user to confirm.')
  })
});

export const askForHighlightColorTool = tool({
  description: 'Ask the user which color to use for a highlight.',
  parameters: z.object({
    message: z.string().describe('A polite message to ask the user for a highlight color.')
  })
});

export const highlightVerseTool = (options: { userId: string }) =>
  tool({
    description:
      'Highlight a verse from the Bible. You must always ask the user for confirmation and the highlight color before using it.',
    parameters: z.object({
      bibleAbbr: z.string().describe('The abbreviation of the Bible the verse is from.'),
      bookName: z.string().describe('The name or abbreviation of the book the verse is from.'),
      chapterNumber: z.number().describe('The number of the chapter the verse is from.'),
      verseNumbers: z.array(z.number().describe('The number of the verse to highlight.')),
      color: z
        .string()
        .optional()
        .describe('The color of the highlight. Must be in valid hex format.')
    }),
    execute: async ({ bibleAbbr, bookName, chapterNumber, verseNumbers, color }) => {
      const queryResult = await db.query.bibles.findFirst({
        columns: {
          id: true,
          abbreviation: true
        },
        where: (bibles, { eq }) => eq(bibles.abbreviation, bibleAbbr),
        with: {
          books: {
            columns: {
              id: true,
              abbreviation: true,
              shortName: true
            },
            where: (books, { or, eq }) =>
              or(eq(books.shortName, bookName), eq(books.abbreviation, bookName)),
            with: {
              chapters: {
                columns: {
                  id: true,
                  number: true
                },
                where: (chapters, { eq }) => eq(chapters.number, chapterNumber),
                with: {
                  verses: {
                    columns: {
                      id: true,
                      number: true
                    },
                    where: (verses, { inArray }) => inArray(verses.number, verseNumbers)
                  }
                }
              }
            }
          }
        }
      });

      const bible = queryResult;
      const book = bible?.books[0];
      const chapter = book?.chapters[0];
      const verses = chapter?.verses;

      if (!verses?.length) {
        return {
          status: 'error',
          message: 'Verse(s) not found'
        } as const;
      }

      await db
        .insert(verseHighlights)
        .values(
          verses.map((verse) => ({
            userId: options.userId,
            verseId: verse.id,
            color: color ?? '#FFD700'
          }))
        )
        .onConflictDoUpdate({
          target: [verseHighlights.verseId],
          set: {
            color: color ?? '#FFD700'
          }
        });

      return {
        status: 'success',
        message: 'Verse highlighted',
        bible: bible!,
        book: book!,
        chapter: chapter!,
        verses: verses!
      } as const;
    }
  });

export const bookmarkVerseTool = (options: { userId: string }) =>
  tool({
    description:
      'Bookmark a verse from the Bible. You must always ask the user for confirmation before using it.',
    parameters: z.object({
      bibleAbbr: z.string().describe('The abbreviation of the Bible the verse is from.'),
      bookName: z.string().describe('The name or abbreviation of the book the verse is from.'),
      chapterNumber: z.number().describe('The number of the chapter the verse is from.'),
      verseNumbers: z.array(z.number().describe('The number of the verse to bookmark.'))
    }),
    execute: async ({ bibleAbbr, bookName, chapterNumber, verseNumbers }) => {
      const queryResult = await db.query.bibles.findFirst({
        columns: {
          id: true,
          abbreviation: true
        },
        where: (bibles, { eq }) => eq(bibles.abbreviation, bibleAbbr),
        with: {
          books: {
            columns: {
              id: true,
              abbreviation: true,
              shortName: true
            },
            where: (books, { or, eq }) =>
              or(eq(books.shortName, bookName), eq(books.abbreviation, bookName)),
            with: {
              chapters: {
                columns: {
                  id: true,
                  number: true
                },
                where: (chapters, { eq }) => eq(chapters.number, chapterNumber),
                with: {
                  verses: {
                    columns: {
                      id: true,
                      number: true
                    },
                    where: (verses, { inArray }) => inArray(verses.number, verseNumbers)
                  }
                }
              }
            }
          }
        }
      });

      const bible = queryResult;
      const book = bible?.books[0];
      const chapter = book?.chapters[0];
      const verses = chapter?.verses;

      if (!verses?.length) {
        return {
          status: 'error',
          message: 'Verse(s) not found'
        } as const;
      }

      await db
        .insert(verseBookmarks)
        .values(
          verses.map((verse) => ({
            userId: options.userId,
            verseId: verse.id
          }))
        )
        .onConflictDoNothing();

      return {
        status: 'success',
        message: 'Verse bookmarked',
        bible: bible!,
        book: book!,
        chapter: chapter!,
        verses: verses!
      } as const;
    }
  });

export const bookmarkChapterTool = (options: { userId: string }) =>
  tool({
    description:
      'Bookmark a chapter from the Bible. You must always ask the user for confirmation before using it.',
    parameters: z.object({
      bibleAbbr: z.string().describe('The abbreviation of the Bible the verse is from.'),
      bookName: z.string().describe('The name or abbreviation of the book the verse is from.'),
      chapterNumbers: z.array(z.number().describe('The number of the chapter the verse is from.'))
    }),
    execute: async ({ bibleAbbr, bookName, chapterNumbers }) => {
      const queryResult = await db.query.bibles.findFirst({
        columns: {
          id: true,
          abbreviation: true
        },
        where: (bibles, { eq }) => eq(bibles.abbreviation, bibleAbbr),
        with: {
          books: {
            columns: {
              id: true,
              abbreviation: true,
              shortName: true
            },
            where: (books, { or, eq }) =>
              or(eq(books.shortName, bookName), eq(books.abbreviation, bookName)),
            with: {
              chapters: {
                columns: {
                  id: true,
                  number: true
                },
                where: (chapters, { inArray }) => inArray(chapters.number, chapterNumbers)
              }
            }
          }
        }
      });

      const bible = queryResult;
      const book = bible?.books[0];
      const chapters = book?.chapters;

      if (!chapters?.length) {
        return {
          status: 'error',
          message: 'Chapter(s) not found'
        } as const;
      }

      await db
        .insert(chapterBookmarks)
        .values(
          chapters.map((chapter) => ({
            userId: options.userId,
            chapterId: chapter.id
          }))
        )
        .onConflictDoNothing();

      return {
        status: 'success',
        message: 'Chapter bookmarked',
        bible: bible!,
        book: book!,
        chapters: chapters!
      } as const;
    }
  });

export const vectorStoreTool = tool({
  description: 'Fetch relevant resources for your answer. This tool does not require confirmation.',
  parameters: z.object({
    terms: z
      .array(z.string())
      .describe('Search terms or phrases that will be used to find relevant resources.')
      .min(1)
      .max(4)
  }),
  execute: async ({ terms }) => {
    const maxDocs = 12;
    return (
      await Promise.all(
        terms.map((term) =>
          vectorStore.searchDocuments(term, {
            limit: maxDocs / terms.length,
            withMetadata: true,
            withEmbedding: false
          })
        )
      )
    )
      .flat()
      .filter((d, i, a) => a.findIndex((d2) => d2.id === d.id) === i); // remove duplicates
  }
});

export const tools = (options: { userId: string }) => ({
  askForConfirmation: askForConfirmationTool,
  askForHighlightColor: askForHighlightColorTool,
  highlightVerse: highlightVerseTool({
    userId: options.userId
  }),
  bookmarkVerse: bookmarkVerseTool({
    userId: options.userId
  }),
  bookmarkChapter: bookmarkChapterTool({
    userId: options.userId
  }),
  vectorStore: vectorStoreTool
});
