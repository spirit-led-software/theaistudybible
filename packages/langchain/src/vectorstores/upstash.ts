import { Document, type DocumentInterface } from '@langchain/core/documents';
import type { EmbeddingsInterface } from '@langchain/core/embeddings';
import { AsyncCaller, type AsyncCallerParams } from '@langchain/core/utils/async_caller';
import { chunkArray } from '@langchain/core/utils/chunk_array';
import { VectorStore } from '@langchain/core/vectorstores';
import { createId } from '@paralleldrive/cuid2';
import { Index as UpstashIndex, type Vector } from '@upstash/vector';

export type UpstashVectorSimilarityFunction = 'COSINE' | 'EUCLIDEAN' | 'DOT_PRODUCT';

export class UpstashVectorStoreDocument extends Document {
  declare metadata: UpstashMetadata;
  id: string | number;
  vector: number[];
  score?: number;
  similarityFunction?: UpstashVectorSimilarityFunction;

  constructor({
    id,
    vector,
    metadata,
    pageContent,
    score,
    similarityFunction
  }: {
    id: string | number;
    vector: number[];
    metadata: UpstashMetadata;
    pageContent: string;
    score?: number;
    similarityFunction?: UpstashVectorSimilarityFunction;
  }) {
    super({ metadata, pageContent });
    this.id = id;
    this.vector = vector;
    this.score = score;
    this.similarityFunction = similarityFunction;
  }
}

/**
 * This interface defines the arguments for the UpstashVectorStore class.
 */
export interface UpstashVectorLibArgs extends AsyncCallerParams {
  index: UpstashIndex;
  filter?: UpstashVectorStore['FilterType'];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type UpstashMetadata = Record<string, any>;

export type UpstashQueryMetadata = UpstashMetadata & {
  /**
   * The page content of the document.
   */
  pageContent: string;
};

export const CONCURRENT_UPSERT_LIMIT = 1000;

/**
 * The main class that extends the 'VectorStore' class. It provides
 * methods for interacting with Upstash index, such as adding documents,
 * deleting documents, performing similarity search and more.
 */
export class UpstashVectorStore extends VectorStore {
  declare FilterType: string;

  index: UpstashIndex;

  caller: AsyncCaller;

  embeddings: EmbeddingsInterface;

  filter?: this['FilterType'];

  _vectorstoreType(): string {
    return 'upstash';
  }

  constructor(embeddings: EmbeddingsInterface, args: UpstashVectorLibArgs) {
    super(embeddings, args);

    this.embeddings = embeddings;

    const { index, filter, ...asyncCallerArgs } = args;

    this.index = index;
    this.filter = filter;
    this.caller = new AsyncCaller(asyncCallerArgs);
  }

  /**
   * This method adds documents to Upstash database. Documents are first converted to vectors
   * using the provided embeddings instance, and then upserted to the database.
   *
   * @param documents Array of Document objects to be added to the database.
   * @param options Optional object containing array of ids for the documents.
   *
   * @returns Promise that resolves with the ids of the provided documents when the upsert operation is done.
   */
  async addDocuments(documents: DocumentInterface[], options?: { ids?: string[] }) {
    const texts = documents.map(({ pageContent }) => pageContent);

    const embeddings = await this.embeddings.embedDocuments(texts);

    return this.addVectors(embeddings, documents, options);
  }

  /**
   * This method adds the provided vectors to Upstash database.
   *
   * @param vectors  Array of vectors to be added to the Upstash database.
   * @param documents Array of Document objects, each associated with a vector.
   * @param options Optional object containing the array of ids foor the vectors.
   *
   * @returns Promise that resolves with the ids of the provided documents when the upsert operation is done.
   */
  async addVectors(
    vectors: number[][],
    documents: DocumentInterface[],
    options?: { ids?: string[] }
  ) {
    const documentIds = options?.ids ?? Array.from({ length: vectors.length }, () => createId());

    const upstashVectors = vectors.map((vector, index) => {
      const metadata: UpstashQueryMetadata = {
        pageContent: documents[index].pageContent,
        ...documents[index].metadata
      } satisfies UpstashQueryMetadata;

      const id = documentIds[index];

      return {
        id,
        vector,
        metadata
      };
    });
    await this.upsert(upstashVectors);
    return documentIds;
  }

  async getVectors(
    ids: string[],
    options?: {
      includeMetadata?: boolean;
      includeVectors?: boolean;
    }
  ) {
    if (ids.length === 0) {
      return [];
    }

    return await this.index.fetch<UpstashQueryMetadata>(ids, options);
  }

  async upsert(vectors: Vector<UpstashQueryMetadata>[]) {
    if (vectors.length === 0) {
      return;
    }

    const vectorChunks = chunkArray(vectors, CONCURRENT_UPSERT_LIMIT);
    const batchRequests = vectorChunks.map((chunk) =>
      this.caller.call(async () => this.index.upsert(chunk))
    );
    await Promise.all(batchRequests);
  }

  /**
   * This method deletes the documents with the provided ids from the Upstash vector database.
   *
   * @param ids Array of ids of the documents to be deleted.
   *
   * @returns Promise that resolves when the delete operation is done.
   */
  async delete(ids: string[]) {
    if (ids.length === 0) {
      return;
    }

    await this.index.delete(ids);
  }

  /**
   * This method deletes all the documents from the Upstash vector database.
   *
   * @returns Promise that resolves when the delete operation is done.
   */
  async deleteAll() {
    await this.index.reset();
  }

  /**
   * This method performs a similarity search in the Upstash vector database
   * over the existing vectors.
   *
   * @param query Query vector for the similarity search.
   * @param k The number of similar vectors to return as result.
   * @param options Optional object containing includeMetadata and includeVectors flags as well as the filter string.
   *
   * @returns Promise that resolves with an array of Document objects.
   * The length of the result will be maximum of 'k' and vectors in the index.
   */
  protected async _runUpstashQuery(
    query: number[],
    k: number,
    options?: {
      includeMetadata?: boolean;
      includeVectors?: boolean;
      filter?: UpstashVectorStore['FilterType'];
    }
  ) {
    return await this.index.query<UpstashQueryMetadata>({
      vector: query,
      topK: k,
      ...options
    });
  }

  /**
   * This method generates a filter string from the provided filter object.
   * See {@link https://upstash.com/docs/vector/features/filtering} for more details.
   *
   * @param filter A filter object containing the filter conditions.
   * @returns The filter string generated from the filter object.
   */
  protected _getFilter(filter?: this['FilterType']): this['FilterType'] | undefined {
    if (this.filter && filter) {
      return `(${this.filter}) AND (${filter})`;
    } else if (this.filter) {
      return this.filter;
    } else if (filter) {
      return filter;
    } else {
      return undefined;
    }
  }

  /**
   * This method performs a similarity search in the Upstash database
   * over the existing vectors.
   * @param query Query vector for the similarity search.
   * @param k The number of similar vectors to return as result.
   * @returns Promise that resolves with an array of tuples, each containing
   *  Document object and similarity score. The length of the result will be
   *  maximum of 'k' and vectors in the index.
   */
  async similaritySearchVectorWithScore(
    query: number[],
    k: number,
    filter?: this['FilterType']
  ): Promise<[UpstashVectorStoreDocument, number][]> {
    const results = await this._runUpstashQuery(query, k, {
      includeMetadata: true,
      includeVectors: true,
      filter: this._getFilter(filter)
    });

    const similarityFunction = await this.index.info().then((info) => info.similarityFunction);
    const searchResult: [UpstashVectorStoreDocument, number][] = results.map((res) => {
      const { score } = res;
      const { pageContent, ...metadata } = (res.metadata ?? {}) as UpstashQueryMetadata;
      return [
        new UpstashVectorStoreDocument({
          id: res.id,
          vector: res.vector,
          metadata,
          pageContent,
          score,
          similarityFunction
        }),
        res.score
      ];
    });

    return searchResult;
  }

  /**
   * This method creates a new UpstashVector instance from an array of texts.
   * The texts are initially converted to Document instances and added to Upstash
   * database.
   * @param texts The texts to create the documents from.
   * @param metadatas The metadata values associated with the texts.
   * @param embeddings Embedding interface of choice, to create the text embeddings.
   * @param dbConfig Object containing the Upstash database configs.
   * @returns Promise that resolves with a new UpstashVector instance.
   */
  static async fromTexts(
    texts: string[],
    metadatas: UpstashMetadata | UpstashMetadata[],
    embeddings: EmbeddingsInterface,
    dbConfig: UpstashVectorLibArgs
  ): Promise<UpstashVectorStore> {
    const docs: DocumentInterface[] = [];

    for (let i = 0; i < texts.length; i += 1) {
      const metadata = Array.isArray(metadatas) ? metadatas[i] : metadatas;
      const newDocument = new Document({
        pageContent: texts[i],
        metadata
      });
      docs.push(newDocument);
    }

    return this.fromDocuments(docs, embeddings, dbConfig);
  }

  /**
   * This method creates a new UpstashVector instance from an array of Document instances.
   * @param docs The docs to be added to Upstash database.
   * @param embeddings Embedding interface of choice, to create the embeddings.
   * @param dbConfig Object containing the Upstash database configs.
   * @returns Promise that resolves with a new UpstashVector instance
   */
  static async fromDocuments(
    docs: DocumentInterface[],
    embeddings: EmbeddingsInterface,
    dbConfig: UpstashVectorLibArgs
  ): Promise<UpstashVectorStore> {
    const instance = new this(embeddings, dbConfig);
    await instance.addDocuments(docs);
    return instance;
  }

  /**
   * This method creates a new UpstashVector instance from an existing index.
   * @param embeddings Embedding interface of the choice, to create the embeddings.
   * @param dbConfig Object containing the Upstash database configs.
   * @returns
   */
  static async fromExistingIndex(
    embeddings: EmbeddingsInterface,
    dbConfig: UpstashVectorLibArgs
  ): Promise<UpstashVectorStore> {
    return new this(embeddings, dbConfig);
  }
}
