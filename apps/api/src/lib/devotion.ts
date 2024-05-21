import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { devotionImages, devotions, devotionsToSourceDocuments } from '@core/database/schema';
import type { Devotion } from '@core/model/devotion';
import { similarityFunctionMapping } from '@core/model/source-document';
import type { StabilityModelInput, StabilityModelOutput } from '@core/types/bedrock';
import {
  getBibleReadingChain,
  getDevotionGeneratorChain,
  getImagePromptChain
} from '@langchain/lib/chains/devotion';
import { getLanguageModel } from '@langchain/lib/llm';
import { getDiveDeeperQueryGeneratorPromptInfo } from '@langchain/lib/prompts/devotion';
import { RAIOutputFixingParser } from '@langchain/output_parsers/rai-output-fixing';
import { eq } from 'drizzle-orm';
import { XMLBuilder } from 'fast-xml-parser';
import { CustomListOutputParser } from 'langchain/output_parsers';
import { db } from './database';

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
  const chain = await getBibleReadingChain({
    previousDevotions: await db.query.devotions.findMany({
      where: (fields, { eq }) => eq(fields.topic, topic)
    })
  });
  const result = await chain.invoke({
    topic
  });

  const bibleReadingText = `${result.book} ${result.chapter}:${result.verseRange} - ${result.text}`;
  console.log(`Bible reading: ${bibleReadingText}`);

  return { topic, bibleReadingText };
}

export async function generateDevotionImages({ devo }: { devo: Devotion }) {
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

  const image = Buffer.from(output.artifacts[0].base64, 'base64');
  const r2Obj = await env.BUCKET.put(`devotions/${devo.id}.png`, image, {
    httpMetadata: {
      contentType: 'image/png'
    }
  });
  if (!r2Obj) {
    throw new Error(`Failed to upload image to R2`);
  }

  await db.insert(devotionImages).values({
    devotionId: devo.id,
    prompt: imagePrompt
  });
}

export async function generateDevotion({
  topic,
  bibleReading
}: {
  topic?: string;
  bibleReading?: string;
}) {
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

    [devo] = await db
      .insert(devotions)
      .values({
        topic,
        bibleReading,
        summary: result.summary,
        reflection: result.reflection,
        prayer: result.prayer
      })
      .returning();

    await Promise.all(
      sourceDocuments.map(async (c) => {
        await db.insert(devotionsToSourceDocuments).values({
          devotionId: devo!.id,
          sourceDocumentId: c.id.toString(),
          distance: 1 - c.score!,
          distanceMetric: similarityFunctionMapping[c.similarityFunction!]
        });
      })
    );

    await generateDevotionImages({ devo });

    const diveDeeperQueries = await generateDiveDeeperQueries({
      devo
    });
    [devo] = await db
      .update(devotions)
      .set({ diveDeeperQueries })
      .where(eq(devotions.id, devo.id))
      .returning();
  } catch (e) {
    console.error(e);
    if (devo) {
      [devo] = await db
        .update(devotions)
        .set({ failed: true })
        .where(eq(devotions.id, devo.id))
        .returning();
    }
  }

  return devo;
}

const getDiveDeeperOutputParser = () =>
  RAIOutputFixingParser.fromParser(new CustomListOutputParser({ separator: '\n' }));

export async function generateDiveDeeperQueries({ devo }: { devo: Devotion }) {
  const diveDeeperOutputParser = getDiveDeeperOutputParser();
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
        topic: devo.topic,
        bibleReading: devo.bibleReading,
        summary: devo.summary,
        reflection: devo.reflection,
        prayer: devo.prayer
      })
    })
    .then((result) => result.map((query) => query.trim()));
}
