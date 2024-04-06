import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import axios from '@revelationsai/core/configs/axios';
import { devotionsToSourceDocuments } from '@revelationsai/core/database/schema';
import type { Devotion } from '@revelationsai/core/model/devotion';
import type { StabilityModelInput, StabilityModelOutput } from '@revelationsai/core/types/bedrock';
import { XMLBuilder } from 'fast-xml-parser';
import { CustomListOutputParser } from 'langchain/output_parsers';
import { Bucket } from 'sst/node/bucket';
import { Config } from 'sst/node/config';
import { createDevotion, updateDevotion } from '../../services/devotion';
import { createDevotionImage } from '../../services/devotion/image';
import { db } from '../database';
import { RAIOutputFixingParser } from '../langchain/output_parsers/rai-output-fixing';
import { getLanguageModel } from '../llm';
import {
  getBibleReadingChain,
  getDevotionGeneratorChain,
  getImageCaptionChain,
  getImagePromptChain
} from './langchain';
import { getDiveDeeperQueryGeneratorPromptInfo } from './prompts';

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
  const imagePrompt = await imagePromptChain.invoke({
    devotion: new XMLBuilder().build({
      topic: devo.topic,
      bibleReading: devo.bibleReading,
      summary: devo.summary,
      reflection: devo.reflection!,
      prayer: devo.prayer!
    })
  });
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
      Bucket: Bucket.PublicBucket.bucketName,
      Key: `devotion-images/${devo.id}.png`
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

  let imageUrl = new URL(s3Url.split('?')[0]);
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore - this may not be defined in non-prod-envs
  if (Config.CDN_URL) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - this may not be defined in non-prod-envs
    imageUrl = new URL(`${Config.CDN_URL}${imageUrl.pathname}`);
  }

  await createDevotionImage({
    devotionId: devo.id,
    url: imageUrl.toString(),
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

const diveDeeperOutputParser = RAIOutputFixingParser.fromParser(
  new CustomListOutputParser({ separator: '\n' })
);

export async function generateDiveDeeperQueries(devotion: Devotion) {
  const { prompt, stopSequences } = await getDiveDeeperQueryGeneratorPromptInfo({
    formatInstructions: diveDeeperOutputParser.getFormatInstructions()
  });
  const queryChain = prompt
    .pipe(
      getLanguageModel({
        modelId: 'claude-3-haiku-20240307',
        stopSequences
      })
    )
    .pipe(diveDeeperOutputParser);

  return await queryChain
    .invoke({
      devotion: new XMLBuilder().build({
        topic: devotion.topic,
        bibleReading: devotion.bibleReading,
        summary: devotion.summary,
        reflection: devotion.reflection,
        prayer: devotion.prayer
      })
    })
    .then((result) => result.map((query) => query.trim()));
}
