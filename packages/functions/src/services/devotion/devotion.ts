import type { CreateDevotionData, Devotion, UpdateDevotionData } from '@core/model';
import { devotions, devotionsToSourceDocuments } from '@core/schema';
import { readOnlyDatabase, readWriteDatabase } from '@lib/database';
import { SQL, asc, desc, eq, sql } from 'drizzle-orm';
import { getDocumentVectorStore } from '../vector-db';
import { generateDevotionImages } from './image';
import { getBibleReadingChain, getDevotionGeneratorChain } from './langchain';

export async function getDevotions(
  options: {
    where?: SQL<unknown>;
    limit?: number;
    offset?: number;
    orderBy?: SQL<unknown>;
  } = {}
) {
  const { where, limit = 25, offset = 0, orderBy = desc(devotions.createdAt) } = options;

  return await readOnlyDatabase
    .select()
    .from(devotions)
    .where(where)
    .limit(limit)
    .offset(offset)
    .orderBy(orderBy);
}

export async function getDevotion(id: string) {
  return (await readOnlyDatabase.select().from(devotions).where(eq(devotions.id, id))).at(0);
}

export async function getDevotionOrThrow(id: string) {
  const devotion = await getDevotion(id);
  if (!devotion) {
    throw new Error(`Devotion with id ${id} not found`);
  }
  return devotion;
}

/**
 * Get the devotion for the given date.
 *
 * @param dateString YYYY-MM-DD
 * @returns
 */
export async function getDevotionByCreatedDate(dateString: string) {
  return (
    await readOnlyDatabase
      .select()
      .from(devotions)
      .where(sql`${devotions.createdAt}::date = ${dateString}::date`)
  ).at(0);
}

export async function getDevotionSourceDocuments(devotion: Devotion) {
  const sourceDocumentRelationships = await readOnlyDatabase
    .select()
    .from(devotionsToSourceDocuments)
    .where(eq(devotionsToSourceDocuments.devotionId, devotion.id))
    .orderBy(asc(devotionsToSourceDocuments.distance));

  const vectorStore = await getDocumentVectorStore();
  const foundSourceDocuments = await vectorStore.getDocumentsByIds(
    sourceDocumentRelationships.map((d) => d.sourceDocumentId)
  );

  return foundSourceDocuments.map((d) => {
    const relationship = sourceDocumentRelationships.find((d2) => d2.devotionId === d.id);
    return {
      ...d,
      distance: relationship?.distance ?? 0,
      distanceMetric: relationship?.distanceMetric ?? 'cosine'
    };
  });
}

export async function createDevotion(data: CreateDevotionData) {
  return (
    await readWriteDatabase
      .insert(devotions)
      .values({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning()
  )[0];
}

export async function updateDevotion(id: string, data: UpdateDevotionData) {
  return (
    await readWriteDatabase
      .update(devotions)
      .set({
        ...data,
        createdAt: undefined,
        updatedAt: new Date()
      })
      .where(eq(devotions.id, id))
      .returning()
  )[0];
}

export async function deleteDevotion(id: string) {
  return (await readWriteDatabase.delete(devotions).where(eq(devotions.id, id)).returning())[0];
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
        await readWriteDatabase.insert(devotionsToSourceDocuments).values({
          devotionId: devo!.id,
          sourceDocumentId: c.id,
          distance: c.distance,
          distanceMetric: c.distanceMetric
        });
      })
    );

    await generateDevotionImages(devo);
  } catch (e) {
    console.error(e);
    if (devo) {
      devo = await updateDevotion(devo.id, { failed: true });
    }
  }

  return devo;
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
