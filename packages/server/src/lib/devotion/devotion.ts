import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import axios from '@revelationsai/core/configs/axios';
import { devotionsToSourceDocuments } from '@revelationsai/core/database/schema';
import type { Devotion } from '@revelationsai/core/model/devotion';
import type { StabilityModelInput, StabilityModelOutput } from '@revelationsai/core/types/bedrock';
import { JsonMarkdownStructuredOutputParser, OutputFixingParser } from 'langchain/output_parsers';
import { PromptTemplate } from 'langchain/prompts';
import { Bucket } from 'sst/node/bucket';
import { z } from 'zod';
import { createDevotion, updateDevotion } from '../../services/devotion';
import { createDevotionImage } from '../../services/devotion/image';
import { getLargeContextModel } from '../../services/llm';
import { OUTPUT_FIXER_PROMPT_TEMPLATE } from '../../services/llm/prompts';
import { db } from '../database';
import {
  getBibleReadingChain,
  getDevotionGeneratorChain,
  getImageCaptionChain,
  getImagePromptChain
} from './langchain';
import { DEVO_DIVE_DEEPER_QUERY_GENERATOR_PROMPT_TEMPLATE } from './prompts';

// 31 topics, one for each day of the month
const devotionTopics = [
  'new life',
  'love',
  'faith',
  'hope',
  'joy',
  'peace',
  'patience',
  'kindness',
  'goodness',
  'gentleness',
  'self-control',
  'forgiveness',
  'prayer',
  'history',
  'prophecy',
  'salvation',
  'sin',
  'heaven',
  'hell',
  'baptism',
  'communion',
  'money',
  'work',
  'marriage',
  'children',
  'family',
  'friendship',
  'generosity',
  'justice',
  'wisdom',
  'humility'
];

function getTopic() {
  // get the topic that corresponds to the current day of the month
  return devotionTopics[new Date().getDate() - 1];
}

export async function getBibleReading() {
  const topic = getTopic();
  console.log(`Devotion topic: ${topic}`);
  const chain = await getBibleReadingChain(topic);
  const result = await chain.invoke({
    topic
  });

  const bibleReadingText = `${result.book} ${result.chapter}:${result.verseRange} - ${result.text}`;
  console.log(`Bible reading: ${bibleReadingText}`);

  return { topic, bibleReadingText };
}

export async function generateDevotionImages(devo: Devotion) {
  const imagePromptChain = getImagePromptChain();
  const imagePromptPhrases = await imagePromptChain.invoke({
    bibleReading: devo.bibleReading,
    summary: devo.summary,
    reflection: devo.reflection,
    prayer: devo.prayer
  });
  const imagePrompt = imagePromptPhrases.join(', ');
  console.log('Image prompt:', imagePrompt);

  const imageCaptionChain = getImageCaptionChain();
  const imageCaption = await imageCaptionChain.invoke({
    imagePrompt,
    bibleReading: devo.bibleReading,
    summary: devo.summary,
    reflection: devo.reflection!,
    prayer: devo.prayer!
  });
  console.log('Image caption:', imageCaption);

  const client = new BedrockRuntimeClient();
  const invokeCommand = new InvokeModelCommand({
    modelId: 'stability.stable-diffusion-xl-v1',
    body: JSON.stringify({
      text_prompts: [
        {
          text: imagePrompt,
          weight: 1.0
        }
      ],
      height: 1024,
      width: 1024,
      cfg_scale: 30,
      style_preset: 'cinematic',
      steps: 50
    } satisfies StabilityModelInput),
    contentType: 'application/json',
    accept: 'application/json'
  });
  const result = await client.send(invokeCommand);
  if (result.$metadata.httpStatusCode !== 200) {
    throw new Error(`Failed to generate image: ${result.$metadata.httpStatusCode}`);
  }

  // convert result.body into string
  const body = new TextDecoder('utf-8').decode(result.body as Uint8Array);
  const output = JSON.parse(body) as StabilityModelOutput;
  if (output.result !== 'success') {
    throw new Error(`Failed to generate image: ${output.result}`);
  }

  const s3Client = new S3Client({});
  const s3Url = await getSignedUrl(
    s3Client,
    new PutObjectCommand({
      ACL: 'public-read',
      ContentType: 'image/png',
      Bucket: Bucket.devotionImageBucket.bucketName,
      Key: `${devo.id}.png`
    })
  );
  if (!s3Url) {
    throw new Error('Failed to get presigned url for s3 upload');
  }

  const image = Buffer.from(output.artifacts[0].base64, 'base64');
  const s3UploadResponse = await axios.put(s3Url, image, {
    headers: {
      'Content-Type': 'image/png',
      'Content-Length': image.length
    }
  });

  if (s3UploadResponse.status !== 200) {
    throw new Error(
      `Failed to upload image to s3: ${s3UploadResponse.status} ${s3UploadResponse.statusText}`
    );
  }

  const imageUrl = s3Url.split('?')[0];
  await createDevotionImage({
    devotionId: devo.id,
    url: imageUrl,
    caption: imageCaption,
    prompt: imagePrompt
  });
}

export async function generateDevotion(topic?: string, bibleReading?: string) {
  let devo: Devotion | undefined;
  try {
    if (!topic || !bibleReading) {
      const { bibleReadingText, topic: newTopic } = await getBibleReading();
      topic = newTopic;
      bibleReading = bibleReadingText;
    }

    const chain = await getDevotionGeneratorChain();
    const { result, sourceDocuments } = await chain.invoke({
      topic,
      bibleReading
    });

    devo = await createDevotion({
      topic,
      bibleReading,
      summary: result.summary,
      reflection: result.reflection,
      prayer: result.prayer
    });

    await Promise.all(
      sourceDocuments.map(async (c) => {
        await db.insert(devotionsToSourceDocuments).values({
          devotionId: devo!.id,
          sourceDocumentId: c.id,
          distance: c.distance,
          distanceMetric: c.distanceMetric
        });
      })
    );

    await generateDevotionImages(devo);

    const diveDeeperQueries = await generateDiveDeeperQueries(devo);
    devo = await updateDevotion(devo.id, {
      diveDeeperQueries
    });
  } catch (e) {
    console.error(e);
    if (devo) {
      devo = await updateDevotion(devo.id, { failed: true });
    }
  }

  return devo;
}

const getDiveDeeperOutputParser = (numQueries: number) =>
  OutputFixingParser.fromLLM(
    getLargeContextModel({
      promptSuffix: '<output>',
      stopSequences: ['</output>'],
      temperature: 0.1,
      topK: 5,
      topP: 0.1
    }),
    JsonMarkdownStructuredOutputParser.fromZodSchema(
      z
        .array(
          z
            .string()
            .describe('A query that will help the user dive deeper into the topic of the devotion.')
        )
        .length(numQueries)
        .describe(
          'A list of queries that will help the user dive deeper into the topic of the devotion.'
        )
    ),
    {
      prompt: PromptTemplate.fromTemplate(OUTPUT_FIXER_PROMPT_TEMPLATE)
    }
  );

export async function generateDiveDeeperQueries(devotion: Devotion, numQueries = 4) {
  const diveDeeperOutputParser = getDiveDeeperOutputParser(numQueries);

  const queryChain = new PromptTemplate({
    inputVariables: ['devotion', 'numQueries'],
    template: DEVO_DIVE_DEEPER_QUERY_GENERATOR_PROMPT_TEMPLATE,
    partialVariables: {
      formatInstructions: diveDeeperOutputParser.getFormatInstructions()
    }
  })
    .pipe(
      getLargeContextModel({
        stream: false,
        maxTokens: 256,
        promptSuffix: '<query>',
        stopSequences: ['</query>']
      })
    )
    .pipe(diveDeeperOutputParser);

  return await queryChain
    .invoke({
      devotion: [
        `<topic>${devotion.topic}</topic>`,
        `<bible_reading>${devotion.bibleReading}</bible_reading>`,
        `<summary>${devotion.summary}</summary>`,
        `<reflection>${devotion.reflection}</reflection>`,
        `<prayer>${devotion.prayer}</prayer>`
      ].join('\n'),
      numQueries: numQueries.toString()
    })
    .then((result) => result.map((query) => query.trim()));
}