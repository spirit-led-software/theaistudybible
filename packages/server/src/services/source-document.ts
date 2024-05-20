import { db } from '@lib/database';
import {
  aiResponsesToSourceDocuments,
  dataSourcesToSourceDocuments,
  devotionsToSourceDocuments,
  userGeneratedImagesToSourceDocuments
} from '@revelationsai/core/database/schema';
import type { SourceDocument } from '@revelationsai/core/model/source-document';
import type { UpstashQueryMetadata } from '@revelationsai/langchain/vectorstores/upstash';
import type { FetchResult } from '@upstash/vector';
import { asc, eq } from 'drizzle-orm';
import { getDocumentVectorStore } from '../lib/vector-db';

export async function getSourceDocumentsByDataSourceId(
  dataSourceId: string
): Promise<SourceDocument[]> {
  const sourceDocumentRelationships = await db
    .select()
    .from(dataSourcesToSourceDocuments)
    .where(eq(dataSourcesToSourceDocuments.dataSourceId, dataSourceId));

  const vectorStore = await getDocumentVectorStore();
  const foundSourceDocuments = await vectorStore.getVectors(
    sourceDocumentRelationships.map((d) => d.sourceDocumentId),
    {
      includeMetadata: true,
      includeVectors: true
    }
  );
  const filteredSourceDocuments = foundSourceDocuments.filter((d) => d !== null) as NonNullable<
    FetchResult<UpstashQueryMetadata>
  >[];
  return filteredSourceDocuments.map((d) => ({
    id: d.id,
    metadata: d.metadata!,
    embedding: d.vector,
    pageContent: d.metadata!.pageContent
  }));
}

export async function getSourceDocumentsByDevotionId(
  devotionId: string
): Promise<SourceDocument[]> {
  const sourceDocumentRelationships = await db
    .select()
    .from(devotionsToSourceDocuments)
    .where(eq(devotionsToSourceDocuments.devotionId, devotionId))
    .orderBy(asc(devotionsToSourceDocuments.distance));

  const vectorStore = await getDocumentVectorStore();
  const foundSourceDocuments = await vectorStore.getVectors(
    sourceDocumentRelationships.map((d) => d.sourceDocumentId),
    {
      includeMetadata: true,
      includeVectors: true
    }
  );

  const filteredSourceDocuments = foundSourceDocuments.filter((d) => d !== null) as NonNullable<
    FetchResult<UpstashQueryMetadata>
  >[];
  return filteredSourceDocuments.map((d) => {
    const relationship = sourceDocumentRelationships.find((d2) => d2.devotionId === d.id);
    return {
      id: d.id,
      metadata: d.metadata!,
      embedding: d.vector,
      pageContent: d.metadata!.pageContent,
      distance: relationship?.distance ?? 0,
      distanceMetric: relationship?.distanceMetric ?? 'cosine'
    };
  });
}

export async function getSourceDocumentsByAiResponseId(
  aiResponseId: string
): Promise<SourceDocument[]> {
  const sourceDocumentRelationships = await db
    .select()
    .from(aiResponsesToSourceDocuments)
    .where(eq(aiResponsesToSourceDocuments.aiResponseId, aiResponseId))
    .orderBy(asc(aiResponsesToSourceDocuments.distance));

  const vectorStore = await getDocumentVectorStore();
  const foundSourceDocuments = await vectorStore.getVectors(
    sourceDocumentRelationships.map((r) => r.sourceDocumentId),
    {
      includeMetadata: true,
      includeVectors: true
    }
  );

  const filteredSourceDocuments = foundSourceDocuments.filter((d) => d !== null) as NonNullable<
    FetchResult<UpstashQueryMetadata>
  >[];
  return filteredSourceDocuments.map((d) => {
    const relationship = sourceDocumentRelationships.find((r) => r.sourceDocumentId === d.id);
    return {
      id: d.id,
      metadata: d.metadata!,
      embedding: d.vector,
      pageContent: d.metadata!.pageContent,
      distance: relationship?.distance ?? 0,
      distanceMetric: relationship?.distanceMetric ?? 'cosine'
    };
  });
}

export async function getSourceDocumentsByUserGeneratedImageId(
  userGeneratedImageId: string
): Promise<SourceDocument[]> {
  const sourceDocumentRelationships = await db
    .select()
    .from(userGeneratedImagesToSourceDocuments)
    .where(eq(userGeneratedImagesToSourceDocuments.userGeneratedImageId, userGeneratedImageId))
    .orderBy(asc(userGeneratedImagesToSourceDocuments.distance));

  const vectorStore = await getDocumentVectorStore();
  const foundSourceDocuments = await vectorStore.getVectors(
    sourceDocumentRelationships.map((r) => r.sourceDocumentId),
    {
      includeMetadata: true,
      includeVectors: true
    }
  );

  const filteredSourceDocuments = foundSourceDocuments.filter((d) => d !== null) as NonNullable<
    FetchResult<UpstashQueryMetadata>
  >[];
  return filteredSourceDocuments.map((d) => {
    const relationship = sourceDocumentRelationships.find((r) => r.sourceDocumentId === d.id);
    return {
      id: d.id,
      metadata: d.metadata!,
      embedding: d.vector,
      pageContent: d.metadata!.pageContent,
      distance: relationship?.distance ?? 0,
      distanceMetric: relationship?.distanceMetric ?? 'cosine'
    };
  });
}
