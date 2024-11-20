import { db } from '@/core/database';
import { devotionImages, devotions } from '@/core/database/schema';
import { s3 } from '@/core/storage';
import { createId } from '@/core/utils/id';
import type { Devotion } from '@/schemas/devotions/types';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { generateObject, generateText } from 'ai';
import { Resource } from 'sst';
import { z } from 'zod';
import { plusTierModels } from '../models';
import { openai, registry } from '../provider-registry';
import { bibleVectorStoreTool, vectorStoreTool } from './tools';
import { getTodaysTopic } from './topics';

const modelInfo = plusTierModels[0];

export const getBibleReading = async (topic: string) => {
  const { text: bibleReading } = await generateText({
    model: registry.languageModel(`${modelInfo.host}:${modelInfo.id}`),
    system: `Your goal is to search the vector store to find a bible reading for a given topic. You must only use Bible readings
found in the vector store. 

Your output will be the bible reading AS-IS in the format:
"<text>" - <book> <chapter>:<verse> (<translation>)`,
    prompt: `Find a bible reading for the topic: "${topic}"`,
    tools: { vectorStore: bibleVectorStoreTool },
    maxSteps: 5,
  });

  return bibleReading;
};

export const generateSummary = async ({
  topic,
  bibleReading,
}: {
  topic: string;
  bibleReading: string;
}) => {
  const { text: summary } = await generateText({
    model: registry.languageModel(`${modelInfo.host}:${modelInfo.id}`),
    system: `You are an expert at summarizing Bible passages. You must search for relevant resources in the vector store to
provide an accurate summary of the passage for the provided topic. You must only use the information from the vector store in your summary. 
Your summary must be 500 words or less.`,
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
    model: registry.languageModel(`${modelInfo.host}:${modelInfo.id}`),
    system: `You are an expert at reflecting upon Bible passages. You must search for relevant resources in the vector store to
provide a thought-provoking and accurate reflection of the passage for the provided topic. You must only use
the information from the vector store in your reflection. Your reflection must be 500 words or less.`,
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
    model: registry.languageModel(`${modelInfo.host}:${modelInfo.id}`),
    system: `You are an expert at writing Christian prayers. You must write a closing prayer for the provided devotional. 
Your prayer must be 200 words or less.`,
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
  const { object } = await generateObject({
    model: registry.languageModel(`${modelInfo.host}:${modelInfo.id}`),
    schema: z.object({
      queries: z.array(z.string()),
    }),
    system: `You must generate follow-up queries to help the user dive deeper into the topic explored in the devotional. The queries must be posed
as though you are the user.

Here is an example query given the topic of "money":
How can I best utilize my money for the Gospel?`,
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

  return object.queries;
};

export const generateImagePrompt = async (devotion: Devotion) => {
  const { text: imagePrompt } = await generateText({
    model: registry.languageModel(`${modelInfo.host}:${modelInfo.id}`),
    system:
      'You must generate a prompt that will generate an image to represent the devotional. Be creative and unique.',
    prompt: `Here is the devotional (delimited by triple dashes):
---
Topic: ${devotion.topic}
Reading: ${devotion.bibleReading}
Summary: ${devotion.summary}
Reflection: ${devotion.reflection}
Prayer: ${devotion.prayer}
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
  const generateImageResponse = await openai.images.generate({
    prompt,
    model: 'dall-e-3',
    size: '1024x1024',
  });

  const getImageResponse = await fetch(generateImageResponse.data[0].url!);
  if (!getImageResponse.ok) {
    throw new Error('Could not download generated image. Please try again later.');
  }

  const id = createId();
  const key = `${id}.png`;
  const image = Buffer.from(await getImageResponse.arrayBuffer());
  const putObjectResult = await s3.send(
    new PutObjectCommand({
      Bucket: Resource.DevotionImagesBucket.name,
      Key: key,
      Body: image,
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
