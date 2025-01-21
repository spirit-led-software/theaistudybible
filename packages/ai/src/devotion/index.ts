import { db } from '@/core/database';
import { devotionImages, devotions } from '@/core/database/schema';
import { s3 } from '@/core/storage';
import { createId } from '@/core/utils/id';
import type { Devotion } from '@/schemas/devotions/types';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { Output, generateText } from 'ai';
import { experimental_generateImage as generateAiImage } from 'ai';
import { initLogger, wrapAISDKModel } from 'braintrust';
import { Resource } from 'sst';
import { z } from 'zod';
import { advancedChatModels } from '../models';
import { openai, registry } from '../provider-registry';
import {
  bibleReadingSystemPrompt,
  diveDeeperSystemPrompt,
  imageSystemPrompt,
  prayerSystemPrompt,
  reflectionSystemPrompt,
  summarySystemPrompt,
} from './system-prompts';
import { bibleVectorStoreTool, vectorStoreTool } from './tools';
import { getTodaysTopic } from './topics';

initLogger({
  projectName: Resource.BrainTrustProjectName.value,
  apiKey: Resource.BrainTrustApiKey.value,
});

const modelInfo = advancedChatModels[0];
let model = registry.languageModel(`${modelInfo.host}:${modelInfo.id}`);
if (Resource.Stage.value === 'production') {
  model = wrapAISDKModel(model);
}

export const getBibleReading = async (topic: string) => {
  const pastDevotions = await db.query.devotions.findMany({
    columns: { id: true, bibleReading: true },
    where: (devotions, { eq }) => eq(devotions.topic, topic),
    orderBy: (devotions, { desc }) => [desc(devotions.createdAt)],
    limit: 10,
  });
  const { text } = await generateText({
    model,
    system: bibleReadingSystemPrompt({ pastDevotions }),
    prompt: `Find a bible reading for the topic: "${topic}"`,
    tools: { bibleVectorStore: bibleVectorStoreTool },
    maxSteps: 10,
  });

  return text;
};

export const generateSummary = async ({
  topic,
  bibleReading,
}: {
  topic: string;
  bibleReading: string;
}) => {
  const { text: summary } = await generateText({
    model,
    system: summarySystemPrompt,
    prompt: `The topic is "${topic}".
Summarize the following bible passage:
${bibleReading}`,
    tools: { vectorStore: vectorStoreTool },
    maxSteps: 5,
  });

  return summary;
};

export const generateReflection = async ({
  topic,
  bibleReading,
  summary,
}: {
  topic: string;
  bibleReading: string;
  summary: string;
}) => {
  const { text: reflection } = await generateText({
    model,
    system: reflectionSystemPrompt,
    prompt: `The topic is "${topic}".

Here is the Bible passage (delimited by triple dashes):
---
${bibleReading}
---

Here is a summary of the passage (delimited by triple dashes):
---
${summary}
---

Write a reflection of the passage.`,
    tools: { vectorStore: vectorStoreTool },
    maxSteps: 5,
  });

  return reflection;
};

export const generatePrayer = async ({
  topic,
  bibleReading,
  summary,
  reflection,
}: {
  topic: string;
  bibleReading: string;
  summary: string;
  reflection: string;
}) => {
  const { text: prayer } = await generateText({
    model,
    system: prayerSystemPrompt,
    prompt: `Here is the devotional (delimited by triple dashes):
---
Topic:
${topic}
Reading:
${bibleReading}
Summary:
${summary}
Reflection:
${reflection}
---

Write a closing prayer.`,
  });

  return prayer;
};

export const generateDiveDeeperQueries = async ({
  topic,
  bibleReading,
  summary,
  reflection,
  prayer,
}: {
  topic: string;
  bibleReading: string;
  summary: string;
  reflection: string;
  prayer: string;
}) => {
  const {
    experimental_output: { queries },
  } = await generateText({
    model,
    experimental_output: Output.object({ schema: z.object({ queries: z.array(z.string()) }) }),
    system: diveDeeperSystemPrompt,
    prompt: `Here is the devotional (delimited by triple dashes):
---
Topic:
${topic}

Reading:
${bibleReading}

Summary:
${summary}

Reflection:
${reflection}

Prayer:
${prayer}
---

Generate 1 to 4 follow-up queries to help the user dive deeper into the topic explored in the devotional.`,
  });

  return queries;
};

export const generateImagePrompt = async (devotion: Devotion) => {
  const { text: imagePrompt } = await generateText({
    model,
    system: imageSystemPrompt,
    prompt: `Here is the devotional (delimited by triple dashes):
---
Topic:
${devotion.topic}

Reading:
${devotion.bibleReading}

Summary:
${devotion.summary}

Reflection:
${devotion.reflection}

Prayer:
${devotion.prayer}
---

Generate the prompt.`,
  });

  return imagePrompt;
};

export const generateImage = async ({
  devotionId,
  prompt,
}: {
  prompt: string;
  devotionId: string;
}) => {
  const { image } = await generateAiImage({
    prompt,
    model: openai.image('dall-e-3'),
    size: '1792x1024',
  });

  const id = createId();
  const key = `${id}.png`;
  const imageBuffer = Buffer.from(image.uint8Array);
  const putObjectResult = await s3.send(
    new PutObjectCommand({
      Bucket: Resource.DevotionImagesBucket.name,
      Key: key,
      Body: imageBuffer,
      ContentType: 'image/png',
      CacheControl: 'public, max-age=31536000, immutable',
    }),
  );
  if (putObjectResult.$metadata.httpStatusCode !== 200) {
    throw new Error('Could not upload generated image to storage. Please try again later.');
  }

  const [devotionImage] = await db
    .insert(devotionImages)
    .values({
      id,
      url: `${Resource.Cdn.url}/devotion-images/${key}`,
      prompt,
      devotionId,
    })
    .returning();

  return devotionImage;
};

export const generateDevotion = async () => {
  const topic = getTodaysTopic();
  const bibleReading = await getBibleReading(topic);
  const summary = await generateSummary({
    topic,
    bibleReading,
  });
  const reflection = await generateReflection({
    topic,
    bibleReading,
    summary,
  });
  const prayer = await generatePrayer({
    topic,
    bibleReading,
    summary,
    reflection,
  });
  const diveDeeperQueries = await generateDiveDeeperQueries({
    topic,
    bibleReading,
    summary,
    reflection,
    prayer,
  });

  const [devotion] = await db
    .insert(devotions)
    .values({
      topic,
      bibleReading,
      summary,
      reflection,
      prayer,
      diveDeeperQueries,
    })
    .returning();

  const imagePrompt = await generateImagePrompt(devotion);
  const image = await generateImage({
    prompt: imagePrompt,
    devotionId: devotion.id,
  });

  return {
    ...devotion,
    image,
  };
};
