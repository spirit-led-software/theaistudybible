import { db } from '@/core/database';
import {
  chapterBookmarks,
  userGeneratedImages,
  verseBookmarks,
  verseHighlights,
} from '@/core/database/schema';
import { s3 } from '@/core/storage';
import { checkAndConsumeCredits, restoreCreditsOnFailure } from '@/core/utils/credits';
import { createId } from '@/core/utils/id';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { tool } from 'ai';
import { Resource } from 'sst';
import { z } from 'zod';
import { openai } from '../provider-registry';
import { vectorStore } from '../vector-store';

export const askForHighlightColorTool = tool({
  description: 'Ask for Highlight Color: Ask which color to use when highlighting a verse.',
  parameters: z.object({
    message: z.string().describe('A polite message to ask the user for a highlight color.'),
  }),
});

export const highlightVerseTool = (options: { userId: string }) =>
  tool({
    description:
      'Highlight Verse: Highlight a verse in the Bible. You must always ask the user for the highlight color using the "Ask for Highlight Color" tool before using this tool.',
    parameters: z.object({
      bibleAbbr: z.string().describe('The abbreviation of the Bible the verse is from.'),
      bookName: z.string().describe('The name or abbreviation of the book the verse is from.'),
      chapterNumber: z.number().describe('The number of the chapter the verse is from.'),
      verseNumbers: z.array(z.number().describe('The number of the verse to highlight.')),
      color: z
        .string()
        .optional()
        .describe('The color of the highlight. Must be in valid hex format.'),
    }),
    execute: async ({ bibleAbbr, bookName, chapterNumber, verseNumbers, color }) => {
      const queryResult = await db.query.bibles.findFirst({
        columns: {
          id: true,
          abbreviation: true,
        },
        where: (bibles, { eq }) => eq(bibles.abbreviation, bibleAbbr),
        with: {
          books: {
            columns: { id: true, code: true, abbreviation: true, shortName: true },
            where: (books, { or, eq }) =>
              or(
                eq(books.shortName, bookName),
                eq(books.code, bookName),
                eq(books.abbreviation, bookName),
              ),
            with: {
              chapters: {
                columns: { id: true, number: true },
                where: (chapters, { eq }) => eq(chapters.number, chapterNumber),
                with: {
                  verses: {
                    columns: { id: true, number: true },
                    where: (verses, { inArray }) => inArray(verses.number, verseNumbers),
                  },
                },
              },
            },
          },
        },
      });

      const bible = queryResult;
      const book = bible?.books[0];
      const chapter = book?.chapters[0];
      const verses = chapter?.verses;

      if (!verses?.length) {
        return {
          status: 'error',
          message: 'Verse(s) not found',
        } as const;
      }

      await db
        .insert(verseHighlights)
        .values(
          verses.map((verse) => ({
            userId: options.userId,
            verseId: verse.id,
            color: color ?? '#FFD700',
          })),
        )
        .onConflictDoUpdate({
          target: [verseHighlights.verseId],
          set: {
            color: color ?? '#FFD700',
          },
        });

      return {
        status: 'success',
        message: 'Verse highlighted',
        bible: bible!,
        book: book!,
        chapter: chapter!,
        verses: verses,
      } as const;
    },
  });

export const bookmarkVerseTool = (options: { userId: string }) =>
  tool({
    description: 'Bookmark Verse: Bookmark a verse in the Bible.',
    parameters: z.object({
      bibleAbbr: z.string().describe('The abbreviation of the Bible the verse is from.'),
      bookName: z.string().describe('The name or abbreviation of the book the verse is from.'),
      chapterNumber: z.number().describe('The number of the chapter the verse is from.'),
      verseNumbers: z.array(z.number().describe('The number of the verse to bookmark.')),
    }),
    execute: async ({ bibleAbbr, bookName, chapterNumber, verseNumbers }) => {
      const queryResult = await db.query.bibles.findFirst({
        columns: {
          id: true,
          abbreviation: true,
        },
        where: (bibles, { eq }) => eq(bibles.abbreviation, bibleAbbr),
        with: {
          books: {
            columns: {
              id: true,
              code: true,
              abbreviation: true,
              shortName: true,
            },
            where: (books, { or, eq }) =>
              or(
                eq(books.shortName, bookName),
                eq(books.code, bookName),
                eq(books.abbreviation, bookName),
              ),
            with: {
              chapters: {
                columns: {
                  id: true,
                  number: true,
                },
                where: (chapters, { eq }) => eq(chapters.number, chapterNumber),
                with: {
                  verses: {
                    columns: {
                      id: true,
                      number: true,
                    },
                    where: (verses, { inArray }) => inArray(verses.number, verseNumbers),
                  },
                },
              },
            },
          },
        },
      });

      const bible = queryResult;
      const book = bible?.books[0];
      const chapter = book?.chapters[0];
      const verses = chapter?.verses;

      if (!verses?.length) {
        return {
          status: 'error',
          message: 'Verse(s) not found',
        } as const;
      }

      await db
        .insert(verseBookmarks)
        .values(
          verses.map((verse) => ({
            userId: options.userId,
            verseId: verse.id,
          })),
        )
        .onConflictDoNothing();

      return {
        status: 'success',
        message: 'Verse bookmarked',
        bible: bible!,
        book: book!,
        chapter: chapter!,
        verses: verses,
      } as const;
    },
  });

export const bookmarkChapterTool = (options: { userId: string }) =>
  tool({
    description: 'Bookmark Chapter: Bookmark a chapter in the Bible.',
    parameters: z.object({
      bibleAbbr: z.string().describe('The abbreviation of the Bible the verse is from.'),
      bookName: z.string().describe('The name or abbreviation of the book the verse is from.'),
      chapterNumbers: z.array(z.number().describe('The number of the chapter the verse is from.')),
    }),
    execute: async ({ bibleAbbr, bookName, chapterNumbers }) => {
      const queryResult = await db.query.bibles.findFirst({
        columns: {
          id: true,
          abbreviation: true,
        },
        where: (bibles, { eq }) => eq(bibles.abbreviation, bibleAbbr),
        with: {
          books: {
            columns: {
              id: true,
              code: true,
              abbreviation: true,
              shortName: true,
            },
            where: (books, { or, eq }) =>
              or(
                eq(books.shortName, bookName),
                eq(books.code, bookName),
                eq(books.abbreviation, bookName),
              ),
            with: {
              chapters: {
                columns: {
                  id: true,
                  number: true,
                },
                where: (chapters, { inArray }) => inArray(chapters.number, chapterNumbers),
              },
            },
          },
        },
      });

      const bible = queryResult;
      const book = bible?.books[0];
      const chapters = book?.chapters;

      if (!chapters?.length) {
        return {
          status: 'error',
          message: 'Chapter(s) not found',
        } as const;
      }

      await db
        .insert(chapterBookmarks)
        .values(
          chapters.map((chapter) => ({
            userId: options.userId,
            chapterId: chapter.id,
          })),
        )
        .onConflictDoNothing();

      return {
        status: 'success',
        message: 'Chapter bookmarked',
        bible: bible!,
        book: book!,
        chapters: chapters,
      } as const;
    },
  });

export const vectorStoreTool = tool({
  description: 'Vector Store: Fetch relevant resources for your answer.',
  parameters: z.object({
    terms: z
      .array(z.string())
      .describe('1 to 6 search terms or phrases that will be used to find relevant resources.'),
  }),
  execute: async ({ terms }) => {
    return await Promise.all(
      terms.map((term) =>
        vectorStore.searchDocuments(term, {
          limit: 12,
          withMetadata: true,
          withEmbedding: false,
        }),
      ),
    ).then((docs) =>
      docs
        .flat()
        .filter((doc, index, self) => self.findIndex((d) => d.id === doc.id) === index)
        .sort((a, b) => b.score - a.score)
        .slice(0, 8),
    );
  },
});

export const generateImageTool = (input: { userId: string }) =>
  tool({
    description:
      'Generate Image: Generate an image from a text prompt. You must use the "Vector Store" tool to fetch relevant resources to make your prompt more detailed.',
    parameters: z.object({
      prompt: z
        .string()
        .describe(
          'The text prompt that will be used to generate the image. This prompt must be detailed enough to make it accurate according to the vector store search results.',
        )
        .min(1)
        .max(1000),
      size: z
        .enum(['1024x1024', '1792x1024', '1024x1792'])
        .optional()
        .default('1024x1024')
        .describe('The size of the generated image. More detailed images need a larger size.'),
    }),
    execute: async ({ prompt, size }) => {
      const hasEnoughCredits = await checkAndConsumeCredits(input.userId, 'image');
      if (!hasEnoughCredits) {
        return {
          status: 'error',
          message: 'Not enough credits to generate an image.',
        } as const;
      }

      try {
        const generateImageResponse = await openai.images.generate({
          prompt,
          model: 'dall-e-3',
          size,
        });

        const getImageResponse = await fetch(generateImageResponse.data[0].url!);
        if (!getImageResponse.ok) {
          return {
            status: 'error',
            message: 'Could not download generated image. Please try again later.',
          } as const;
        }

        const id = createId();
        const key = `${id}.png`;
        const image = Buffer.from(await getImageResponse.arrayBuffer());
        const putObjectResult = await s3.send(
          new PutObjectCommand({
            Bucket: Resource.GeneratedImagesBucket.name,
            Key: key,
            Body: image,
          }),
        );
        if (putObjectResult.$metadata.httpStatusCode !== 200) {
          return {
            status: 'error',
            message: 'Could not upload generated image to storage. Please try again later.',
          } as const;
        }

        const [generatedImage] = await db
          .insert(userGeneratedImages)
          .values({
            id,
            url: `${Resource.Cdn.url}/generated-images/${key}`,
            userPrompt: prompt,
            prompt: generateImageResponse.data[0].revised_prompt,
            userId: input.userId,
          })
          .returning();

        return {
          status: 'success',
          message: 'Image generated',
          image: generatedImage,
        } as const;
      } catch (error) {
        console.error(JSON.stringify(error, null, 2));
        await restoreCreditsOnFailure(input.userId, 'image');
        return {
          status: 'error',
          message: 'An unknown error occurred. Please try again later.',
        } as const;
      }
    },
  });

export const tools = (input: { userId: string }) => ({
  askForHighlightColor: askForHighlightColorTool,
  highlightVerse: highlightVerseTool({
    userId: input.userId,
  }),
  bookmarkVerse: bookmarkVerseTool({
    userId: input.userId,
  }),
  bookmarkChapter: bookmarkChapterTool({
    userId: input.userId,
  }),
  generateImage: generateImageTool({
    userId: input.userId,
  }),
  vectorStore: vectorStoreTool,
});
