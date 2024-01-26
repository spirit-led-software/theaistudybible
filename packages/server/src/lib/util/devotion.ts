import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import axios from '@revelationsai/core/configs/axios';
import replicateConfig from '@revelationsai/core/configs/replicate';
import { devotionsToSourceDocuments } from '@revelationsai/core/database/schema';
import type { Devotion } from '@revelationsai/core/model/devotion';
import { JsonMarkdownStructuredOutputParser, OutputFixingParser } from 'langchain/output_parsers';
import { PromptTemplate } from 'langchain/prompts';
import Replicate from 'replicate';
import { Bucket } from 'sst/node/bucket';
import { z } from 'zod';
import { createDevotion, updateDevotion } from '../../services/devotion';
import { createDevotionImage } from '../../services/devotion/image';
import {
  getBibleReadingChain,
  getDevotionGeneratorChain,
  getImageCaptionChain,
  getImagePromptChain
} from '../../services/devotion/langchain';
import { DEVO_DIVE_DEEPER_QUERY_GENERATOR_PROMPT_TEMPLATE } from '../../services/devotion/prompts';
import { getLargeContextModel } from '../../services/llm';
import { OUTPUT_FIXER_PROMPT_TEMPLATE } from '../../services/llm/prompts';
import { db } from '../database';

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
  console.log('Image prompt phrases:', imagePromptPhrases);

  const imageCaptionChain = getImageCaptionChain();
  const imageCaption = await imageCaptionChain.invoke({
    imagePrompt: imagePromptPhrases.join(', '),
    bibleReading: devo.bibleReading,
    summary: devo.summary,
    reflection: devo.reflection!,
    prayer: devo.prayer!
  });
  console.log('Image caption:', imageCaption);

  const imagePrompt = `${imagePromptPhrases.join(
    ', '
  )}, christian, photo realistic, beautiful, stunning, 8k uhd, high quality, high definition, color, 3d, detailed hands, detailed fingers, detailed eyes, detailed feet`;
  const negativeImagePrompt = `deformed iris, deformed pupils, semi-realistic, cgi, render, sketch, cartoon, drawing, anime, text, cropped, out of frame, worst quality, low quality, jpeg artifacts, ugly, duplicate, morbid, mutilated, extra fingers, mutated hands, poorly drawn hands, poorly drawn face, mutation, deformed, blurry, dehydrated, bad anatomy, bad proportions, extra limbs, cloned face, disfigured, gross proportions, malformed limbs, missing arms, missing legs, extra arms, extra legs, fused fingers, too many fingers, long neck, random floating objects, black and white`;

  const replicate = new Replicate({
    auth: replicateConfig.apiKey
  });
  const output = await replicate.run(replicateConfig.imageModel, {
    input: {
      prompt: imagePrompt,
      negative_prompt: negativeImagePrompt,
      width: 1024,
      height: 1024,
      num_outputs: 1,
      scheduler: 'KarrasDPM',
      refine: 'expert_ensemble_refiner',
      num_inference_steps: 50,
      guidance_scale: 14,
      prompt_strength: 1.0,
      high_noise_frac: 0.8
    }
  });
  console.log('Output from replicate:', output);
  if (!Array.isArray(output)) {
    throw new Error('Replicate output not formatted as expected');
  }

  const urlArray = output as string[];

  for (let i = 0; i < urlArray.length; i++) {
    const url = urlArray[i];
    try {
      const image = await axios.get(url, {
        responseType: 'arraybuffer'
      });

      const s3Client = new S3Client({});
      const s3Url = await getSignedUrl(
        s3Client,
        new PutObjectCommand({
          ACL: 'public-read',
          ContentType: 'image/png',
          Bucket: Bucket.devotionImageBucket.bucketName,
          Key: `${devo.id}-${i}.png`
        })
      );

      if (!s3Url) {
        throw new Error('Failed to get presigned url for s3 upload');
      }

      const s3UploadResponse = await axios.put(s3Url, image.data, {
        headers: {
          'Content-Type': 'image/png',
          'Content-Length': image.data.byteLength
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
        prompt: imagePrompt,
        negativePrompt: negativeImagePrompt
      });
    } catch (e) {
      console.error('Error saving devotion image', e);
    }
  }
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
