import { PutObjectCommand } from '@aws-sdk/client-s3';
import { createId } from '@theaistudybible/core//util/id';
import { db } from '@theaistudybible/core/database';
import { devotionImages, devotions } from '@theaistudybible/core/database/schema';
import { Devotion } from '@theaistudybible/core/model';
import { s3 } from '@theaistudybible/core/storage';
import { formNumberSequenceString } from '@theaistudybible/core/util/number';
import { generateText } from 'ai';
import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';
import { plusTierModels } from '../models';
import { openai, registry } from '../provider-registry';
import { bibleVectorStoreTool, vectorStoreTool } from './tools';
import { getTodaysTopic } from './topics';

const modelInfo = plusTierModels[0];

export const getBibleReading = async (topic: string) => {
  const bibleReadingSchema = z.object({
    bibleAbbreviation: z.string().describe('The abbreviation of the bible the reading is from.'),
    bookName: z.string().describe('The name of the book the reading is from.'),
    chapterNumber: z.number().describe('The number of the chapter the reading is from.'),
    verseNumbers: z.array(z.number()).describe('The numbers of the verses in the reading.'),
    text: z.string().describe('The bible reading text.')
  });

  const { text: bibleReading } = await generateText({
    model: registry.languageModel(`${modelInfo.provider}:${modelInfo.id}`),
    system: `Your goal is to search the vector store to find a bible reading for a given topic. You can search the vector store
up to 5 times to find the bible reading. You can only use Bible reading

JSON Schema:
${JSON.stringify(zodToJsonSchema(bibleReadingSchema))}
You MUST answer with a JSON object that matches the JSON schema above.
`,
    prompt: `Find a bible reading for the topic: "${topic}"`,
    tools: {
      vectorStore: bibleVectorStoreTool
    },
    toolChoice: 'required',
    maxToolRoundtrips: 5
  });

  return bibleReadingSchema.parse(JSON.parse(bibleReading));
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
provide an accurate summary of the passage for the provided topic. You can search the vector store up to 5 times. You must only use
the information from the vector store in your summary.`,
    prompt: `The topic is "${topic}".
Summarize the following bible passage:
${bibleReading}`,
    tools: {
      vectorStore: vectorStoreTool
    },
    toolChoice: 'required',
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
provide a thought-provoking and accurate reflection of the passage for the provided topic. You can search the vector store up to 5 times. You must only use
the information from the vector store in your reflection.`,
    prompt: `The topic is "${topic}".
Here is the Bible passage:
${bibleReading}
Here is a summary of the passage:
${summary}

Write a reflection of the passage.`,
    tools: {
      vectorStore: vectorStoreTool
    },
    toolChoice: 'required',
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
    system: `You are an expert at writing Christian prayers. You must write a closing prayer for the provided devotional.`,
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
    toolChoice: 'required',
    maxToolRoundtrips: 5
  });

  return prayer;
};

export const generateImagePrompt = async (devotion: Devotion) => {
  const { text: imagePrompt } = await generateText({
    model: registry.languageModel(`${modelInfo.provider}:${modelInfo.id}`),
    system: `You must generate a prompt that will generate an accurate image to represent the devotional. You must use the vector store to search
for relevant resources to make your prompt extremely accurate. You can search the vector store up to 5 times. You must only use
the information from the vector store in your prompt.`,
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
    toolChoice: 'required',
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
  const bibleReadingText = `${bibleReading.text} - ${bibleReading.bookName} ${bibleReading.chapterNumber}:${formNumberSequenceString(bibleReading.verseNumbers)} (${bibleReading.bibleAbbreviation})`;
  const summary = await generateSummary({
    topic,
    bibleReading: bibleReadingText
  });
  const reflection = await generateReflection({
    topic,
    bibleReading: bibleReadingText,
    summary
  });
  const prayer = await generatePrayer({
    topic,
    bibleReading: bibleReadingText,
    summary,
    reflection
  });

  const [devotion] = await db
    .insert(devotions)
    .values({
      topic,
      bibleReading: bibleReadingText,
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
