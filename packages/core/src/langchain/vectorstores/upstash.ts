import { Document, type DocumentInterface } from '@langchain/core/documents';
import type { EmbeddingsInterface } from '@langchain/core/embeddings';
import { AsyncCaller, type AsyncCallerParams } from '@langchain/core/utils/async_caller';
import { chunkArray } from '@langchain/core/utils/chunk_array';
import { VectorStore } from '@langchain/core/vectorstores';
import { Index as UpstashIndex } from '@upstash/vector';
import { v4 as uuidV4 } from 'uuid';

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pageContent: any;
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

    const { index, ...asyncCallerArgs } = args;

    this.index = index;
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
    const documentIds = options?.ids ?? Array.from({ length: vectors.length }, () => uuidV4());

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

    const vectorChunks = chunkArray(upstashVectors, CONCURRENT_UPSERT_LIMIT);

    const batchRequests = vectorChunks.map((chunk) =>
      this.caller.call(async () => this.index.upsert(chunk))
    );

    await Promise.all(batchRequests);

    return documentIds;
  }

  async getVectors(
    ids: string[],
    options: {
      includeMetadata?: boolean;
      includeVectors?: boolean;
    }
  ) {
    const vectors = await this.index.fetch<UpstashQueryMetadata>(ids, options);
    return vectors;
  }

  /**
   * This method deletes the documents with the provided ids from the Upstash vector database.
   *
   * @param ids Array of ids of the documents to be deleted.
   *
   * @returns Promise that resolves when the delete operation is done.
   */
  async delete(ids: string[]) {
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
    const queryResult = await this.index.query<UpstashQueryMetadata>({
      vector: query,
      topK: k,
      ...options
    });

    return queryResult;
  }

  /**
   * This method generates a filter string from the provided filter object.
   * See {@link https://upstash.com/docs/vector/features/filtering} for more details.
   *
   * @param filter A filter object containing the filter conditions.
   * @returns The filter string generated from the filter object.
   */
  protected _getFilter(filter?: this['FilterType']): this['FilterType'] | undefined {
    let filterString: string | undefined;
    if (filter) {
      filterString += filter;
    }
    if (this.filter) {
      if (filterString) {
        filterString += ' AND ';
      }
      filterString += this.filter;
    }
    return filterString;
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
  ): Promise<[DocumentInterface, number][]> {
    const results = await this._runUpstashQuery(query, k, {
      includeMetadata: true,
      filter: this._getFilter(filter)
    });

    const searchResult: [DocumentInterface, number][] = results.map((res) => {
      const { pageContent, ...metadata } = (res.metadata ?? {}) as UpstashQueryMetadata;
      return [
        new Document({
          metadata,
          pageContent
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
    const instance = new this(embeddings, dbConfig);
    return instance;
  }
}
