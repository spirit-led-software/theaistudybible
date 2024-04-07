import { db } from '@lib/database';
import {
  aiResponsesToSourceDocuments,
  dataSourcesToSourceDocuments,
  devotionsToSourceDocuments,
  userGeneratedImagesToSourceDocuments
} from '@revelationsai/core/database/schema';
import type { UpstashQueryMetadata } from '@revelationsai/core/langchain/vectorstores/upstash';
import type { FetchResult } from '@upstash/vector';
import { asc, eq } from 'drizzle-orm';
import { getDocumentVectorStore } from '../lib/vector-db';

export async function getSourceDocumentsByDataSourceId(
  dataSourceId: string,
  options?: { includeMetadata?: boolean; includeVectors?: boolean }
) {
  const sourceDocumentRelationships = await db
    .select()
    .from(dataSourcesToSourceDocuments)
    .where(eq(dataSourcesToSourceDocuments.dataSourceId, dataSourceId));

  const vectorStore = await getDocumentVectorStore();
  const foundSourceDocuments = await vectorStore.getVectors(
    sourceDocumentRelationships.map((d) => d.sourceDocumentId),
    options
  );
  return foundSourceDocuments.filter((d) => d !== null) as NonNullable<
    FetchResult<UpstashQueryMetadata>
  >[];
}

export async function getSourceDocumentsByDevotionId(
  devotionId: string,
  options?: { includeMetadata?: boolean; includeVectors?: boolean }
) {
  const sourceDocumentRelationships = await db
    .select()
    .from(devotionsToSourceDocuments)
    .where(eq(devotionsToSourceDocuments.devotionId, devotionId))
    .orderBy(asc(devotionsToSourceDocuments.score));

  const vectorStore = await getDocumentVectorStore();
  const foundSourceDocuments = await vectorStore.getVectors(
    sourceDocumentRelationships.map((d) => d.sourceDocumentId),
    options
  );

  const filteredSourceDocuments = foundSourceDocuments.filter((d) => d !== null) as NonNullable<
    FetchResult<UpstashQueryMetadata>
  >[];
  return filteredSourceDocuments.map((d) => {
    const relationship = sourceDocumentRelationships.find((d2) => d2.devotionId === d!.id);
    return {
      ...d,
      score: relationship?.score ?? 0,
      similarityFunction: relationship?.similarityFunction ?? 'COSINE'
    };
  });
}

export async function getSourceDocumentsByAiResponseId(
  aiResponseId: string,
  options?: {
    includeMetadata?: boolean;
    includeVectors?: boolean;
  }
) {
  const sourceDocumentRelationships = await db
    .select()
    .from(aiResponsesToSourceDocuments)
    .where(eq(aiResponsesToSourceDocuments.aiResponseId, aiResponseId))
    .orderBy(asc(aiResponsesToSourceDocuments.score));

  const vectorStore = await getDocumentVectorStore();
  const foundSourceDocuments = await vectorStore.getVectors(
    sourceDocumentRelationships.map((r) => r.sourceDocumentId),
    options
  );

  const filteredSourceDocuments = foundSourceDocuments.filter((d) => d !== null) as NonNullable<
    FetchResult<UpstashQueryMetadata>
  >[];
  return filteredSourceDocuments.map((d) => {
    const relationship = sourceDocumentRelationships.find((r) => r.sourceDocumentId === d.id);
    return {
      ...d,
      score: relationship?.score ?? 0,
      similarityFunction: relationship?.similarityFunction ?? 'COSINE'
    };
  });
}

export async function getSourceDocumentsByUserGeneratedImageId(
  userGeneratedImageId: string,
  options?: {
    includeMetadata?: boolean;
    includeVectors?: boolean;
  }
) {
  const sourceDocumentRelationships = await db
    .select()
    .from(userGeneratedImagesToSourceDocuments)
    .where(eq(userGeneratedImagesToSourceDocuments.userGeneratedImageId, userGeneratedImageId))
    .orderBy(asc(userGeneratedImagesToSourceDocuments.score));

  const vectorStore = await getDocumentVectorStore();
  const foundSourceDocuments = await vectorStore.getVectors(
    sourceDocumentRelationships.map((r) => r.sourceDocumentId),
    options
  );

  const filteredSourceDocuments = foundSourceDocuments.filter((d) => d !== null) as NonNullable<
    FetchResult<UpstashQueryMetadata>
  >[];
  return filteredSourceDocuments.map((d) => {
    const relationship = sourceDocumentRelationships.find((r) => r.sourceDocumentId === d!.id);
    return {
      ...d,
      score: relationship?.score ?? 0,
      similarityFunction: relationship?.similarityFunction ?? 'COSINE'
    };
  });
}
