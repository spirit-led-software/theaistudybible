import { PutObjectCommand } from '@aws-sdk/client-s3';
import { createId } from '@theaistudybible/core//util/id';
import { db } from '@theaistudybible/core/database';
import { devotionImages, devotions } from '@theaistudybible/core/database/schema';
import { Devotion } from '@theaistudybible/core/model';
import { s3 } from '@theaistudybible/core/storage';
import { generateText } from 'ai';
import { plusTierModels } from '../models';
import { openai, registry } from '../provider-registry';
import { bibleVectorStoreTool, vectorStoreTool } from './tools';
import { getTodaysTopic } from './topics';

const modelInfo = plusTierModels[0];

export const getBibleReading = async (topic: string) => {
  const { text: bibleReading } = await generateText({
    model: registry.languageModel(`${modelInfo.provider}:${modelInfo.id}`),
    system: `Your goal is to search the vector store to find a bible reading for a given topic. You must only use Bible readings
found in the vector store. 

Your output will be the bible reading AS-IS in the format:
"<text>" - <book> <chapter>:<verse> (<translation>)`,
    prompt: `Find a bible reading for the topic: "${topic}"`,
    tools: {
      vectorStore: bibleVectorStoreTool
    },
    maxToolRoundtrips: 5
  });

  return bibleReading;
};

export const generateSummary = async ({
  topic,
  bibleReading
}: {
  topic: string;
  bibleReading: string;
}) => {
  const { text: summary } = await generateText({
    model: registry.languageModel(`${modelInfo.provider}:${modelInfo.id}`),
    system: `You are an expert at summarizing Bible passages. You must search for relevant resources in the vector store to
provide an accurate summary of the passage for the provided topic. You must only use the information from the vector store in your summary. 
Your summary must be 500 words or less.`,
    prompt: `The topic is "${topic}".
Summarize the following bible passage:
${bibleReading}`,
    tools: {
      vectorStore: vectorStoreTool
    },
    maxToolRoundtrips: 5
  });

  return summary;
};

export const generateReflection = async ({
  topic,
  bibleReading,
  summary
}: {
  topic: string;
  bibleReading: string;
  summary: string;
}) => {
  const { text: reflection } = await generateText({
    model: registry.languageModel(`${modelInfo.provider}:${modelInfo.id}`),
    system: `You are an expert at reflecting upon Bible passages. You must search for relevant resources in the vector store to
provide a thought-provoking and accurate reflection of the passage for the provided topic. You must only use
the information from the vector store in your reflection. Your reflection must be 500 words or less.`,
    prompt: `The topic is "${topic}".
Here is the Bible passage:
${bibleReading}
Here is a summary of the passage:
${summary}

Write a reflection of the passage.`,
    tools: {
      vectorStore: vectorStoreTool
    },
    maxToolRoundtrips: 5
  });

  return reflection;
};

export const generatePrayer = async ({
  topic,
  bibleReading,
  summary,
  reflection
}: {
  topic: string;
  bibleReading: string;
  summary: string;
  reflection: string;
}) => {
  const { text: prayer } = await generateText({
    model: registry.languageModel(`${modelInfo.provider}:${modelInfo.id}`),
    system: `You are an expert at writing Christian prayers. You must write a closing prayer for the provided devotional. 
Your prayer must be 200 words or less.`,
    prompt: `Here is the devotional:
Topic:
${topic}
Reading:
${bibleReading}
Summary:
${summary}
Reflection:
${reflection}

Write a closing prayer.`,
    maxToolRoundtrips: 5
  });

  return prayer;
};

export const generateImagePrompt = async (devotion: Devotion) => {
  const { text: imagePrompt } = await generateText({
    model: registry.languageModel(`${modelInfo.provider}:${modelInfo.id}`),
    system: `You must generate a prompt that will generate an accurate image to represent the devotional. You must use the vector store to search
for relevant resources to make your prompt extremely accurate. You must only use the information from the vector store in your prompt. 
Your prompt must be 200 words or less.`,
    prompt: `Here is the devotional:
Topic: ${devotion.topic}
Reading: ${devotion.bibleReading}
Summary: ${devotion.summary}
Reflection: ${devotion.reflection}
Prayer: ${devotion.prayer}

Generate a prompt that will generate an accurate image to represent the devotional.`,
    tools: {
      vectorStore: vectorStoreTool
    },
    maxToolRoundtrips: 5
  });

  return imagePrompt;
};

export const generateImage = async ({
  devotionId,
  prompt
}: {
  prompt: string;
  devotionId: string;
}) => {
  const generateImageResponse = await openai.images.generate({
    prompt,
    model: 'dall-e-3',
    size: '1024x1024'
  });

  const getImageResponse = await fetch(generateImageResponse.data[0].url!);
  if (!getImageResponse.ok) {
    throw new Error('Could not download generated image. Please try again later.');
  }

  const id = `devo_${createId()}`;
  const key = `devotion-images/${id}.png`;
  const image = Buffer.from(await getImageResponse.arrayBuffer());
  const putObjectResult = await s3.send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET!,
      Key: key,
      Body: image
    })
  );
  if (putObjectResult.$metadata.httpStatusCode !== 200) {
    throw new Error('Could not upload generated image to storage. Please try again later.');
  }

  const [devotionImage] = await db
    .insert(devotionImages)
    .values({
      id,
      url: `${process.env.S3_BUCKET_PUBLIC_URL}/${key}`,
      prompt,
      devotionId
    })
    .returning();

  return devotionImage;
};

export const generateDevotion = async () => {
  const topic = getTodaysTopic();
  const bibleReading = await getBibleReading(topic);
  const summary = await generateSummary({
    topic,
    bibleReading
  });
  const reflection = await generateReflection({
    topic,
    bibleReading,
    summary
  });
  const prayer = await generatePrayer({
    topic,
    bibleReading,
    summary,
    reflection
  });

  console.log(JSON.stringify({ topic, bibleReading, summary, reflection, prayer }));

  const [devotion] = await db
    .insert(devotions)
    .values({
      topic,
      bibleReading,
      summary,
      reflection,
      prayer
    })
    .returning();

  const imagePrompt = await generateImagePrompt(devotion);
  const image = await generateImage({
    prompt: imagePrompt,
    devotionId: devotion.id
  });

  return {
    ...devotion,
    image
  };
};
