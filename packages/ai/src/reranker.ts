import { Resource } from 'sst';
import type { Document, DocumentWithScore } from './types/document';

const voyageAiBaseUrl = 'https://api.voyageai.com/v1';

type VoyageAiRerankResponse = {
  object: 'list';
  data: {
    index: number;
    relevance_score: number;
  }[];
  model: 'rerank-2' | 'rerank-2-lite';
  usage: {
    total_tokens: number;
  };
};

export type RerankerOptions = {
  model?: 'rerank-2' | 'rerank-2-lite';
  topK?: number;
  returnDocuments?: boolean;
  truncation?: boolean;
};

export class Reranker {
  async rerankDocuments(
    query: string,
    documents: Document[],
    options?: RerankerOptions,
  ): Promise<DocumentWithScore[]> {
    const response = await fetch(`${voyageAiBaseUrl}/rerank`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${Resource.VoyageAiApiKey.value}`,
      },
      body: JSON.stringify({
        model: options?.model ?? 'rerank-2-lite',
        query,
        documents: documents.map((document) => document.content),
        top_k: options?.topK,
        return_documents: options?.returnDocuments,
        truncation: options?.truncation,
      }),
    });
    if (!response.ok) {
      throw new Error(`Failed to rerank documents: ${response.statusText}`);
    }
    const { data }: VoyageAiRerankResponse = await response.json();
    return data.map((item) => ({
      ...documents[item.index],
      score: item.relevance_score,
    }));
  }
}
