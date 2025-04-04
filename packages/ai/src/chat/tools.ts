import { cache } from '@/core/cache';
import { db } from '@/core/database';
import { chapterBookmarks, userGeneratedImages, verseHighlights } from '@/core/database/schema';
import { s3 } from '@/core/storage';
import { getStripeData, isMinistry, isPro } from '@/core/stripe/utils';
import { createId } from '@/core/utils/id';
import type { Role } from '@/schemas/roles/types';
import type { User } from '@/schemas/users/types';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { Ratelimit } from '@upstash/ratelimit';
import { type DataStreamWriter, tool } from 'ai';
import { experimental_generateImage as generateImage } from 'ai';
import { formatDate } from 'date-fns';
import { Resource } from 'sst';
import { z } from 'zod';
import { openai } from '../provider-registry';
import { vectorStore } from '../vector-store';

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
      bibleAbbreviation: z.string().describe('The abbreviation of the Bible the verse is from.'),
      bookCode: z
        .string()
        .describe(
          'The 3 character USX code of the book the verse is from. This is always the first 3 characters of the book name without any spaces or punctuation.',
        ),
      chapterNumber: z.number().describe('The number of the chapter the verse is from.'),
      verseNumbers: z.array(z.number().describe('The number of the verse to highlight.')),
      color: z
        .string()
        .optional()
        .describe('The color of the highlight. Must be in valid hex format.'),
    }),
    execute: async ({ bibleAbbreviation, bookCode, chapterNumber, verseNumbers, color }) => {
      try {
        const queryResult = await db.query.bibles.findFirst({
          columns: { abbreviation: true },
          where: (bibles, { eq }) => eq(bibles.abbreviation, bibleAbbreviation),
          with: {
            books: {
              columns: { code: true, abbreviation: true, shortName: true },
              where: (books, { or, eq }) =>
                or(
                  eq(books.code, bookCode),
                  eq(books.shortName, bookCode),
                  eq(books.abbreviation, bookCode),
                ),
              with: {
                chapters: {
                  columns: { code: true, number: true },
                  where: (chapters, { eq }) => eq(chapters.number, chapterNumber),
                  with: {
                    verses: {
                      columns: { code: true, number: true },
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
              bibleAbbreviation: bibleAbbreviation,
              verseCode: verse.code,
              color: color ?? '#FFD700',
            })),
          )
          .onConflictDoUpdate({
            target: [verseHighlights.userId, verseHighlights.verseCode],
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

export const bookmarkChapterTool = (input: { dataStream: DataStreamWriter; userId: string }) =>
  tool({
    description: 'Bookmark Chapter: Bookmark a chapter in the Bible.',
    parameters: z.object({
      bibleAbbreviation: z.string().describe('The abbreviation of the Bible the verse is from.'),
      bookCode: z
        .string()
        .describe(
          'The 3 character USX code of the book the verse is from. This is always the first 3 characters of the book name without any spaces or punctuation.',
        ),
      chapterNumbers: z.array(z.number().describe('The number of the chapter the verse is from.')),
    }),
    execute: async ({ bibleAbbreviation, bookCode, chapterNumbers }) => {
      try {
        const queryResult = await db.query.bibles.findFirst({
          columns: { abbreviation: true },
          where: (bibles, { eq }) => eq(bibles.abbreviation, bibleAbbreviation),
          with: {
            books: {
              columns: { code: true, abbreviation: true, shortName: true },
              where: (books, { or, eq }) =>
                or(
                  eq(books.shortName, bookCode),
                  eq(books.code, bookCode),
                  eq(books.abbreviation, bookCode),
                ),
              with: {
                chapters: {
                  columns: { code: true, number: true },
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
              bibleAbbreviation: bibleAbbreviation,
              chapterCode: chapter.code,
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

export const vectorStoreTool = (input: {
  dataStream: DataStreamWriter;
  bibleAbbreviation?: string | null;
}) =>
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
            category: z
              .enum(['bible', 'theology', 'general'])
              .optional()
              .default('general')
              .describe(
                'The category of resources to search for. "bible" will only search for resources from the Bible. "theology" will only search for popular theology resources such as commentaries, sermons, and theological books. "general" will search for resources from all types. The default is "general".',
              ),
          }),
        )
        .min(1)
        .max(4)
        .describe(
          'A list of 1 to 4 search terms, their weights, and their category. The search terms are searched separately and should not rely on each other.',
        ),
    }),
    execute: async ({ terms }) => {
      try {
        // Get initial results from vector search
        const docs = await Promise.all(
          terms.map(async ({ term, weight, category }) => {
            let filter = `bibleAbbreviation = "${input.bibleAbbreviation}" or (type != "bible" and type != "BIBLE")`;
            if (category === 'bible') {
              filter = `(type = "bible" or type = "BIBLE") and bibleAbbreviation = "${input.bibleAbbreviation}"`;
            } else if (category === 'theology') {
              filter = 'category = "theology"';
            }
            return await vectorStore
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
              );
          }),
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

export const generateImageTool = (input: {
  dataStream: DataStreamWriter;
  userId: string;
  user?: User | null;
  roles?: Role[] | null;
}) =>
  tool({
    description:
      'Generate Image: Generate an image from a text prompt. You must use the "Vector Store" tool to fetch relevant resources to make your prompt more detailed.',
    parameters: z.object({
      prompt: z
        .string()
        .min(1)
        .max(1000)
        .describe(
          'The text prompt that will be used to generate the image. This prompt must be detailed enough to make it accurate according to the vector store search results.',
        ),
      size: z
        .enum(['1024x1024', '1792x1024', '1024x1792'])
        .optional()
        .default('1024x1024')
        .describe('The size of the generated image. More detailed images need a larger size.'),
    }),
    execute: async ({ prompt, size }, { abortSignal }) => {
      const rlPrefix = 'image-generation';
      let ratelimit = new Ratelimit({
        prefix: rlPrefix,
        redis: cache,
        limiter: Ratelimit.slidingWindow(2, '24h'),
      });
      if (input.user) {
        const subData = await getStripeData(input.user.stripeCustomerId);
        if (isPro(subData)) {
          ratelimit = new Ratelimit({
            prefix: rlPrefix,
            redis: cache,
            limiter: Ratelimit.slidingWindow(10, '24h'),
          });
        } else if (isMinistry(subData) || input.roles?.some((role) => role.id === 'admin')) {
          ratelimit = new Ratelimit({
            prefix: rlPrefix,
            redis: cache,
            limiter: Ratelimit.slidingWindow(100, '24h'),
          });
        }
      }

      const ratelimitResult = await ratelimit.limit(input.userId);
      if (!ratelimitResult.success) {
        return {
          status: 'error',
          message: `You have exceeded your daily image generation limit. Please upgrade or try again at ${formatDate(ratelimitResult.reset, 'M/d/yy h:mm a')}.`,
        } as const;
      }

      try {
        const { image } = await generateImage({
          prompt,
          model: openai.image('dall-e-3'),
          size,
          abortSignal,
        });

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
        await ratelimit.resetUsedTokens(input.userId).then(() =>
          ratelimit.limit(input.userId, {
            rate: ratelimitResult.limit - ratelimitResult.remaining,
          }),
        );
        return {
          status: 'error',
          message: error instanceof Error ? error.message : 'An unknown error occurred',
        } as const;
      }
    },
  });

export const tools = (input: {
  dataStream: DataStreamWriter;
  userId: string;
  user?: User | null;
  roles?: Role[] | null;
  bibleAbbreviation?: string | null;
}) => ({
  askForHighlightColor: askForHighlightColorTool({ dataStream: input.dataStream }),
  highlightVerse: highlightVerseTool({ dataStream: input.dataStream, userId: input.userId }),
  bookmarkChapter: bookmarkChapterTool({ dataStream: input.dataStream, userId: input.userId }),
  generateImage: generateImageTool({
    dataStream: input.dataStream,
    userId: input.userId,
    user: input.user,
    roles: input.roles,
  }),
  vectorStore: vectorStoreTool({
    dataStream: input.dataStream,
    bibleAbbreviation: input.bibleAbbreviation,
  }),
});
