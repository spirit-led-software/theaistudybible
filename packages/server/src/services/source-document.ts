import { db } from '@lib/database';
import {
  aiResponsesToSourceDocuments,
  devotionsToSourceDocuments,
  userGeneratedImagesToSourceDocuments
} from '@revelationsai/core/database/schema';
import { asc, eq } from 'drizzle-orm';
import { getDocumentVectorStore } from '../lib/vector-db';

export async function getSourceDocumentsByDevotionId(devotionId: string) {
  const sourceDocumentRelationships = await db
    .select()
    .from(devotionsToSourceDocuments)
    .where(eq(devotionsToSourceDocuments.devotionId, devotionId))
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

export async function getSourceDocumentsByAiResponseId(aiResponseId: string) {
  const sourceDocumentRelationships = await db
    .select()
    .from(aiResponsesToSourceDocuments)
    .where(eq(aiResponsesToSourceDocuments.aiResponseId, aiResponseId))
    .orderBy(asc(aiResponsesToSourceDocuments.distance));

  const vectorStore = await getDocumentVectorStore();
  const foundSourceDocuments = await vectorStore.getDocumentsByIds(
    sourceDocumentRelationships.map((r) => r.sourceDocumentId)
  );

  return foundSourceDocuments.map((d) => {
    const relationship = sourceDocumentRelationships.find((r) => r.sourceDocumentId === d.id);
    return {
      ...d,
      distance: relationship?.distance ?? 0,
      distanceMetric: relationship?.distanceMetric ?? 'cosine'
    };
  });
}

export async function getSourceDocumentsByUserGeneratedImageId(userGeneratedImageId: string) {
  const sourceDocumentRelationships = await db
    .select()
    .from(userGeneratedImagesToSourceDocuments)
    .where(eq(userGeneratedImagesToSourceDocuments.userGeneratedImageId, userGeneratedImageId))
    .orderBy(asc(userGeneratedImagesToSourceDocuments.distance));

  const vectorStore = await getDocumentVectorStore();
  const foundSourceDocuments = await vectorStore.getDocumentsByIds(
    sourceDocumentRelationships.map((r) => r.sourceDocumentId)
  );

  return foundSourceDocuments.map((d) => {
    const relationship = sourceDocumentRelationships.find((r) => r.sourceDocumentId === d.id);
    return {
      ...d,
      distance: relationship?.distance ?? 0,
      distanceMetric: relationship?.distanceMetric ?? 'cosine'
    };
  });
}
