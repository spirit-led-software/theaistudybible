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
import { type DataStreamWriter, tool } from 'ai';
import { experimental_generateImage as generateImage } from 'ai';
import { Resource } from 'sst';
import { z } from 'zod';
import { openai } from '../provider-registry';
import { vectorStore } from '../vector-store';

export const thinkingTool = (_input: { dataStream: DataStreamWriter }) =>
  tool({
    description:
      'Thinking: Share your concise step-by-step reasoning process. Keep it focused and brief while showing key logical steps.',
    parameters: z.object({
      thoughts: z
        .string()
        .describe('Brief step-by-step reasoning about the question, formatted in valid markdown.'),
    }),
    execute: ({ thoughts }) =>
      Promise.resolve({
        status: 'success',
        message: 'Thoughts recorded',
        thoughts,
      } as const),
  });

export const askForHighlightColorTool = (_input: { dataStream: DataStreamWriter }) =>
  tool({
    description: 'Ask for Highlight Color: Ask which color to use when highlighting a verse.',
    parameters: z.object({
      message: z.string().describe('A polite message to ask the user for a highlight color.'),
    }),
  });

export const highlightVerseTool = (input: { dataStream: DataStreamWriter; userId: string }) =>
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
      try {
        const queryResult = await db.query.bibles.findFirst({
          columns: { id: true, abbreviation: true },
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
          throw new Error('Verse(s) not found');
        }

        await db
          .insert(verseHighlights)
          .values(
            verses.map((verse) => ({
              userId: input.userId,
              verseId: verse.id,
              color: color ?? '#FFD700',
            })),
          )
          .onConflictDoUpdate({
            target: [verseHighlights.userId, verseHighlights.verseId],
            set: { color: color ?? '#FFD700' },
          });

        return {
          status: 'success',
          message: 'Verse highlighted',
          bible: bible!,
          book: book!,
          chapter: chapter!,
          verses: verses,
        } as const;
      } catch (err) {
        console.error('Error highlighting verse', err);
        return {
          status: 'error',
          message: err instanceof Error ? err.message : 'An unknown error occurred',
        } as const;
      }
    },
  });

export const bookmarkVerseTool = (input: { dataStream: DataStreamWriter; userId: string }) =>
  tool({
    description: 'Bookmark Verse: Bookmark a verse in the Bible.',
    parameters: z.object({
      bibleAbbr: z.string().describe('The abbreviation of the Bible the verse is from.'),
      bookName: z.string().describe('The name or abbreviation of the book the verse is from.'),
      chapterNumber: z.number().describe('The number of the chapter the verse is from.'),
      verseNumbers: z.array(z.number().describe('The number of the verse to bookmark.')),
    }),
    execute: async ({ bibleAbbr, bookName, chapterNumber, verseNumbers }) => {
      try {
        const queryResult = await db.query.bibles.findFirst({
          columns: { id: true, abbreviation: true },
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
          throw new Error('Verse(s) not found');
        }

        await db
          .insert(verseBookmarks)
          .values(
            verses.map((verse) => ({
              userId: input.userId,
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
      } catch (err) {
        console.error('Error bookmarking verse', err);
        return {
          status: 'error',
          message: err instanceof Error ? err.message : 'An unknown error occurred',
        } as const;
      }
    },
  });

export const bookmarkChapterTool = (input: { dataStream: DataStreamWriter; userId: string }) =>
  tool({
    description: 'Bookmark Chapter: Bookmark a chapter in the Bible.',
    parameters: z.object({
      bibleAbbr: z.string().describe('The abbreviation of the Bible the verse is from.'),
      bookName: z.string().describe('The name or abbreviation of the book the verse is from.'),
      chapterNumbers: z.array(z.number().describe('The number of the chapter the verse is from.')),
    }),
    execute: async ({ bibleAbbr, bookName, chapterNumbers }) => {
      try {
        const queryResult = await db.query.bibles.findFirst({
          columns: { id: true, abbreviation: true },
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
          throw new Error('Chapter(s) not found');
        }

        await db
          .insert(chapterBookmarks)
          .values(
            chapters.map((chapter) => ({
              userId: input.userId,
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
      } catch (err) {
        console.error('Error bookmarking chapter', err);
        return {
          status: 'error',
          message: err instanceof Error ? err.message : 'An unknown error occurred',
        } as const;
      }
    },
  });

export const vectorStoreTool = (input: { dataStream: DataStreamWriter; bibleId?: string | null }) =>
  tool({
    description: 'Vector Store: Fetch relevant resources for your answer.',
    parameters: z.object({
      terms: z
        .array(
          z.object({
            term: z.string().describe('The search term or phrase to search for.'),
            weight: z
              .number()
              .min(0)
              .max(1)
              .optional()
              .default(1)
              .describe(
                'The weight of the search term between 0 and 1. The default is 1. A weight of 0 will not be used to rerank the results.',
              ),
          }),
        )
        .min(1)
        .max(4)
        .describe(
          '1 to 4 search terms or phrases that will be used to find relevant resources. The search terms are searched separately and should not rely on each other.',
        ),
      type: z
        .enum(['bible', 'theology', 'general'])
        .optional()
        .default('general')
        .describe(
          'The type of resources to search for. "bible" will only search for resources from the Bible. "theology" will only search for popular theology resources such as commentaries, sermons, and theological books. "general" will search for resources from all types. The default is "general".',
        ),
    }),
    execute: async ({ terms, type }) => {
      try {
        let filter = `bibleId = "${input.bibleId}" or (type != "bible" and type != "BIBLE")`;
        if (type === 'bible') {
          filter = `(type = "bible" or type = "BIBLE") and bibleId = "${input.bibleId}"`;
        } else if (type === 'theology') {
          filter = 'category = "theology"';
        }

        // Get initial results from vector search
        const docs = await Promise.all(
          terms.map(({ term, weight }) =>
            vectorStore
              .searchDocuments(term, {
                limit: 12,
                withMetadata: true,
                withEmbedding: false,
                filter,
              })
              .then((docs) =>
                docs.map((doc) => ({
                  ...doc,
                  score: doc.score * weight,
                })),
              ),
          ),
        ).then((docs) =>
          docs
            .flat()
            .filter((doc, index, self) => index === self.findIndex((d) => d.id === doc.id))
            .toSorted((a, b) => b.score - a.score),
        );

        return {
          status: 'success',
          documents: docs.slice(0, 12),
        } as const;
      } catch (err) {
        console.error('Error fetching vector store', err);
        return {
          status: 'error',
          message: err instanceof Error ? err.message : 'An unknown error occurred',
        } as const;
      }
    },
  });

export const generateImageTool = (input: { dataStream: DataStreamWriter; userId: string }) =>
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
        const { image } = await generateImage({ prompt, model: openai.image('dall-e-3'), size });

        const id = createId();
        const key = `${id}.png`;
        const imageBuffer = Buffer.from(image.uint8Array);
        const putObjectResult = await s3.send(
          new PutObjectCommand({
            Bucket: Resource.GeneratedImagesBucket.name,
            Key: key,
            Body: imageBuffer,
            ContentType: 'image/png',
            CacheControl: 'public, max-age=31536000, immutable',
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
            userId: input.userId,
          })
          .returning();

        return {
          status: 'success',
          message: 'Image generated',
          image: generatedImage,
        } as const;
      } catch (error) {
        console.error('Error generating image', error);
        await restoreCreditsOnFailure(input.userId, 'image');
        return {
          status: 'error',
          message: 'An unknown error occurred. Please try again later.',
        } as const;
      }
    },
  });

export const tools = (input: {
  dataStream: DataStreamWriter;
  userId: string;
  bibleId?: string | null;
}) => ({
  thinking: thinkingTool({ dataStream: input.dataStream }),
  askForHighlightColor: askForHighlightColorTool({ dataStream: input.dataStream }),
  highlightVerse: highlightVerseTool({ dataStream: input.dataStream, userId: input.userId }),
  bookmarkVerse: bookmarkVerseTool({ dataStream: input.dataStream, userId: input.userId }),
  bookmarkChapter: bookmarkChapterTool({ dataStream: input.dataStream, userId: input.userId }),
  generateImage: generateImageTool({ dataStream: input.dataStream, userId: input.userId }),
  vectorStore: vectorStoreTool({ dataStream: input.dataStream, bibleId: input.bibleId }),
});
