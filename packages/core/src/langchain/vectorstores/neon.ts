import { Client, neon, neonConfig, type NeonQueryFunction } from '@neondatabase/serverless';
import { Document } from 'langchain/document';
import type { Embeddings } from 'langchain/embeddings/base';
import { VectorStore } from 'langchain/vectorstores/base';
import ws from 'ws';
import type { Metadata } from '../../types/metadata';

export type DistanceMetric = 'l2' | 'cosine' | 'innerProduct';

export interface NeonVectorStoreArgs {
  connectionOptions: {
    readWriteUrl: string;
    readOnlyUrl?: string;
  };
  tableName?: string;
  dimensions: number;
  filters?: (Metadata | string)[];
  verbose?: boolean;
  distance?: DistanceMetric;
  hnswIdxM?: number;
  hnswIdxEfConstruction?: number;
  hnswIdxEfSearch?: number;
}

export class NeonVectorStoreDocument extends Document {
  id: string;
  embedding: string;
  distance?: number;
  distanceMetric?: DistanceMetric;

  constructor(fields: {
    id: string;
    metadata?: Metadata;
    pageContent: string;
    embedding: string;
    distance?: number;
    distanceMetric?: DistanceMetric;
  }) {
    super(fields);
    this.id = fields.id;
    this.embedding = fields.embedding;
    this.distance = fields.distance;
    this.distanceMetric = fields.distanceMetric;
  }
}

const defaultDocumentTableName = 'documents';

const distanceOperators = {
  l2: '<->',
  cosine: '<=>',
  innerProduct: '<#>'
};

export class NeonVectorStore extends VectorStore {
  declare FilterType: Metadata | string;
  readonly tableName: string;
  readonly filters: (Metadata | string)[];
  readonly dimensions: number;
  readonly verbose: boolean;
  readonly distance: DistanceMetric;

  readonly hnswIdxM: number;
  readonly hnswIdxEfConstruction: number;
  readonly hnswIdxEfSearch: number;

  private readonly readOnlyUrl: string;
  private readonly readOnlyQueryFn: NeonQueryFunction<false, false>;

  private readonly readWriteUrl: string;
  private readonly readWriteQueryFn: NeonQueryFunction<false, false>;

  _vectorstoreType(): string {
    return 'neon';
  }

  private constructor(embeddings: Embeddings, fields: NeonVectorStoreArgs) {
    super(embeddings, fields);
    this.tableName = fields.tableName ?? defaultDocumentTableName;
    this.filters = fields.filters ?? [];
    this.dimensions = fields.dimensions;
    this.verbose = fields.verbose ?? false;
    this.distance = fields.distance ?? 'l2';
    this.hnswIdxM = fields.hnswIdxM ?? 16;
    this.hnswIdxEfConstruction = fields.hnswIdxEfConstruction ?? 64;
    this.hnswIdxEfSearch = fields.hnswIdxEfSearch ?? 40;

    neonConfig.webSocketConstructor = ws;

    this.readOnlyUrl =
      fields.connectionOptions.readOnlyUrl || fields.connectionOptions.readWriteUrl;
    this.readOnlyQueryFn = neon(this.readOnlyUrl, { readOnly: true });

    this.readWriteUrl = fields.connectionOptions.readWriteUrl;
    this.readWriteQueryFn = neon(this.readWriteUrl, { readOnly: false });
  }

  _log(message: unknown, ...optionalParams: unknown[]): void {
    if (this.verbose) {
      console.log(`[NeonVectorStore] ${message}`, ...optionalParams);
    }
  }

  static async fromConnectionString(
    embeddings: Embeddings,
    fields: NeonVectorStoreArgs
  ): Promise<NeonVectorStore> {
    const neonVectorStore = new NeonVectorStore(embeddings, fields);
    return neonVectorStore;
  }

  _generateFiltersString(filter?: this['FilterType']): string {
    let filterString = '';
    if (filter) {
      if (typeof filter === 'string') {
        filterString = filter;
      } else if (typeof filter === 'object') {
        filterString = `(metadata @> '${JSON.stringify(filter)}'::jsonb)`;
      } else {
        throw new Error(`Invalid filter type ${typeof filter}`);
      }
    }
    if (this.filters.length > 0) {
      if (filterString.length > 0) {
        filterString += ' AND ';
      }
      filterString += `(${this.filters
        .map((value) => {
          if (typeof value === 'string') {
            return value;
          } else if (typeof value === 'object') {
            return `(metadata @> '${JSON.stringify(value)}')`;
          } else {
            throw new Error(`Invalid filter type ${typeof value}`);
          }
        })
        .join(' OR ')})`;
    }
    return filterString;
  }

  async addDocuments(documents: Document[]): Promise<void> {
    if (documents.length === 0) {
      this._log(`No documents to add to vector store`);
      return;
    }
    await this.addVectors(
      await this.embeddings.embedDocuments(documents.map(({ pageContent }) => pageContent)),
      documents
    );
  }

  async addVectors(vectors: number[][], documents: Document[]): Promise<void> {
    const rows = vectors.map((embedding, idx) => {
      const embeddingString = `[${embedding.join(',')}]`;
      const documentRow = {
        page_content: documents[idx].pageContent,
        embedding: embeddingString,
        metadata: documents[idx].metadata
      };
      return documentRow;
    });

    const errors: unknown[] = [];
    const chunkSize = 50;
    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize);
      this._log(`Inserting ${chunk.length} rows into vector store ${i} to ${i + chunk.length}`);
      try {
        await this.transaction(async (client) => {
          await client.query(
            `INSERT INTO ${this.tableName} (page_content, embedding, metadata)
            SELECT * FROM jsonb_to_recordset($1::jsonb)
            AS x(page_content text, embedding vector(${this.dimensions}), metadata jsonb);`,
            [JSON.stringify(chunk)]
          );
        });
      } catch (e) {
        this._log(`Error inserting chunk: ${e}`);
        errors.push(e);
      }
    }
    if (errors.length > 0) {
      throw new Error(`Error inserting chunks into vector store: ${errors}`);
    }
  }

  async similaritySearchVectorWithScore(
    query: number[],
    k: number,
    filter?: this['FilterType'],
    offset?: number
  ): Promise<[NeonVectorStoreDocument, number][]> {
    const embeddingString = `[${query.join(',')}]`;
    const _filter = this._generateFiltersString(filter);
    const _offset = offset ?? 0;
    this._log(
      `Searching for documents\nembedding=${embeddingString}\nk=${k}\nfilter='${_filter}'\noffset=${_offset}`
    );

    try {
      const docRows = await this.readOperation(async (client) => {
        client.query(`SET LOCAL hnsw.ef_search = '${this.hnswIdxEfSearch}';`);
        if (this.distance === 'l2') {
          return await client.query(
            `SELECT *, embedding ${distanceOperators[this.distance]} $1 AS "_distance"
            FROM ${this.tableName}
            ${_filter ? `WHERE (${_filter})` : ''}
            ORDER BY "_distance" ASC
            LIMIT $2
            OFFSET $3;`,
            [embeddingString, k, _offset]
          );
        } else if (this.distance === 'cosine') {
          return await client.query(
            `SELECT *, embedding ${distanceOperators[this.distance]} $1 AS "_distance"
            FROM ${this.tableName}
            ${_filter ? `WHERE (${_filter})` : ''}
            ORDER BY "_distance" ASC
            LIMIT $2
            OFFSET $3;`,
            [embeddingString, k, _offset]
          );
        } else if (this.distance === 'innerProduct') {
          return await client.query(
            `SELECT *, (embedding ${distanceOperators[this.distance]} $1) * -1 AS "_distance"
            FROM ${this.tableName}
            ${_filter ? `WHERE (${_filter})` : ''}
            ORDER BY "_distance" DESC
            LIMIT $2
            OFFSET $3;`,
            [embeddingString, k, _offset]
          );
        } else {
          throw new Error(`Unknown distance metric ${this.distance}`);
        }
      });

      const results: [NeonVectorStoreDocument, number][] = [];
      for (const doc of docRows.rows) {
        if (doc._distance != null && doc.page_content != null) {
          const document = new NeonVectorStoreDocument({
            id: doc.id,
            metadata: doc.metadata,
            pageContent: doc.page_content,
            embedding: doc.embedding,
            distance: doc._distance,
            distanceMetric: this.distance
          });
          results.push([document, doc._distance]);
        }
      }

      this._log(
        `Found ${docRows.rows.length} similar results from vector store: ${JSON.stringify(results)}`
      );
      return results;
    } catch (e) {
      this._log(`Error searching vector store: ${e}`);
      throw e;
    }
  }

  async getDocumentsByIds(
    ids: string[],
    filter?: this['FilterType']
  ): Promise<NeonVectorStoreDocument[]> {
    const _filter = this._generateFiltersString(filter);
    this._log(`Getting documents\nids=${ids}\nfilter='${_filter}'`);
    try {
      const docRows = await this.readOperation(async (client) => {
        return await client.query(
          `SELECT * FROM ${this.tableName}
          WHERE (
            id = ANY($1)
            ${_filter ? `AND (${_filter})` : ''}
          );`,
          [ids]
        );
      });

      this._log(
        `Found ${docRows.rows.length} documents by ids from vector store: ${JSON.stringify(
          docRows.rows
        )}`
      );
      return docRows.rows.map((row) => {
        return new NeonVectorStoreDocument({
          id: row.id,
          metadata: row.metadata,
          pageContent: row.page_content,
          embedding: row.embedding
        });
      });
    } catch (e) {
      this._log(`Error getting documents by ids from vector store: ${e}`);
      throw e;
    }
  }

  /**
   * Ensure that the table exists in the database.
   * Only needs to be called once. Will not overwrite existing table or index.
   */
  async ensureTableInDatabase(): Promise<void> {
    try {
      await this.transaction(async (client) => {
        this._log('Creating vector extension');
        await client.query('CREATE EXTENSION IF NOT EXISTS vector;');

        this._log(`Creating table ${this.tableName}`);
        await client.query(`
          CREATE TABLE IF NOT EXISTS ${this.tableName} (
            "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
            page_content text,
            metadata jsonb,
            embedding vector(${this.dimensions})
          );
        `);

        this._log(`Creating GIN index of metadata on ${this.tableName}.`);
        await client.query(
          `CREATE INDEX IF NOT EXISTS ${this.tableName}_gin_metadata_idx
            ON ${this.tableName}
            USING GIN (metadata);`
        );
      });
    } catch (e) {
      this._log('Error ensuring table in database:', e);
      throw e;
    }
  }

  async createHnswIndex(options?: { recreate?: boolean }): Promise<void> {
    try {
      if (this.distance === 'l2') {
        this._log(`Creating L2 HNSW index on ${this.tableName}.`);
        const l2IndexName = `${this.tableName}_l2_hnsw_idx`;
        if (options?.recreate) {
          this._log(`Dropping existing L2 HNSW index ${l2IndexName} on ${this.tableName}.`);
          await this.readWriteQueryFn(`DROP INDEX CONCURRENTLY IF EXISTS ${l2IndexName};`);
        }
        await this.readWriteQueryFn(
          `CREATE INDEX CONCURRENTLY IF NOT EXISTS ${l2IndexName} ON ${this.tableName}
              USING hnsw (embedding vector_l2_ops)
              WITH (
                m = ${this.hnswIdxM}, 
                ef_construction = ${this.hnswIdxEfConstruction}
              );`
        );
      } else if (this.distance === 'cosine') {
        this._log(`Creating Cosine HNSW index on ${this.tableName}.`);
        const cosineIndexName = `${this.tableName}_cosine_hnsw_idx`;
        if (options?.recreate) {
          this._log(`Dropping existing Cosine HNSW index ${cosineIndexName} on ${this.tableName}.`);
          await this.readWriteQueryFn(`DROP INDEX CONCURRENTLY IF EXISTS ${cosineIndexName};`);
        }
        await this.readWriteQueryFn(
          `CREATE INDEX CONCURRENTLY IF NOT EXISTS ${cosineIndexName} ON ${this.tableName}
              USING hnsw (embedding vector_cosine_ops)
              WITH (
                m = ${this.hnswIdxM}, 
                ef_construction = ${this.hnswIdxEfConstruction}
              );`
        );
      } else if (this.distance === 'innerProduct') {
        this._log(`Creating inner product HNSW index on ${this.tableName}.`);
        const ipIndexName = `${this.tableName}_ip_hnsw_idx`;
        if (options?.recreate) {
          this._log(
            `Dropping existing inner product HNSW index ${ipIndexName} on ${this.tableName}.`
          );
          await this.readWriteQueryFn(`DROP INDEX CONCURRENTLY IF EXISTS ${ipIndexName};`);
        }
        await this.readWriteQueryFn(
          `CREATE INDEX CONCURRENTLY IF NOT EXISTS ${ipIndexName} ON ${this.tableName}
              USING hnsw (embedding vector_ip_ops)
              WITH (
                m = ${this.hnswIdxM}, 
                ef_construction = ${this.hnswIdxEfConstruction}
              );`
        );
      } else {
        throw new Error(`Unknown distance metric ${this.distance}`);
      }
    } catch (e) {
      this._log('Error creating HNSW index:', e);
      throw e;
    }
  }

  async createPartialHnswIndex(
    indexName: string,
    options?: {
      filter?: NeonVectorStore['FilterType'];
      recreate?: boolean;
    }
  ): Promise<void> {
    const _filter = this._generateFiltersString(options?.filter);
    if (_filter.length === 0) {
      throw new Error(`Cannot create a partial HNSW index without filter`);
    }

    try {
      if (this.distance === 'l2') {
        this._log(`Creating L2 HNSW index on ${this.tableName}.`);
        const fullIndexName = `${this.tableName}_${indexName}_l2_idx`;
        if (options?.recreate) {
          this._log(`Dropping existing L2 HNSW index ${fullIndexName} on ${this.tableName}.`);
          await this.readWriteQueryFn(`DROP INDEX IF EXISTS ${fullIndexName};`);
        }
        await this.readWriteQueryFn(
          `CREATE INDEX CONCURRENTLY IF NOT EXISTS ${fullIndexName}
              ON ${this.tableName}
              USING hnsw (embedding vector_l2_ops)
              WITH (
                m = ${this.hnswIdxM}, 
                ef_construction = ${this.hnswIdxEfConstruction}
              )
              WHERE (${_filter});`
        );
      } else if (this.distance === 'cosine') {
        this._log(`Creating Cosine HNSW index on ${this.tableName}.`);
        const fullIndexName = `${this.tableName}_${indexName}_cosine_idx`;
        if (options?.recreate) {
          this._log(`Dropping existing Cosine HNSW index ${fullIndexName} on ${this.tableName}.`);
          await this.readWriteQueryFn(`DROP INDEX IF EXISTS ${fullIndexName};`);
        }
        await this.readWriteQueryFn(
          `CREATE INDEX CONCURRENTLY IF NOT EXISTS ${fullIndexName}
              ON ${this.tableName}
              USING hnsw (embedding vector_cosine_ops)
              WITH (
                m = ${this.hnswIdxM}, 
                ef_construction = ${this.hnswIdxEfConstruction}
              )
              WHERE (${_filter});`
        );
      } else if (this.distance === 'innerProduct') {
        this._log(`Creating inner product HNSW index on ${this.tableName}.`);
        const fullIndexName = `${this.tableName}_${indexName}_ip_idx`;
        if (options?.recreate) {
          this._log(
            `Dropping existing inner product HNSW index ${fullIndexName} on ${this.tableName}.`
          );
          await this.readWriteQueryFn(`DROP INDEX IF EXISTS ${fullIndexName};`);
        }
        await this.readWriteQueryFn(
          `CREATE INDEX CONCURRENTLY IF NOT EXISTS ${fullIndexName}
              ON ${this.tableName}
              USING hnsw (embedding vector_ip_ops)
              WITH (
                m = ${this.hnswIdxM}, 
                ef_construction = ${this.hnswIdxEfConstruction}
              )
              WHERE (${_filter});`
        );
      } else {
        throw new Error(`Unknown distance metric ${this.distance}`);
      }
    } catch (e) {
      this._log('Error creating partial HNSW index:', e);
      throw e;
    }
  }

  async deleteTableInDatabase(): Promise<void> {
    this._log(`Dropping table ${this.tableName}`);
    await this.transaction(async (client) => {
      await client.query(`DROP TABLE IF EXISTS ${this.tableName} CASCADE;`);
    });
  }

  async dropHnswIndex(): Promise<void> {
    try {
      await this.transaction(async (client) => {
        if (this.distance === 'l2') {
          this._log(`Dropping L2 HNSW index on ${this.tableName}.`);
          const l2IndexName = `${this.tableName}_l2_hnsw_idx`;
          await client.query(`DROP INDEX IF EXISTS ${l2IndexName};`);
        } else if (this.distance === 'cosine') {
          this._log(`Dropping Cosine HNSW index on ${this.tableName}.`);
          const cosineIndexName = `${this.tableName}_cosine_hnsw_idx`;
          await client.query(`DROP INDEX IF EXISTS ${cosineIndexName};`);
        } else if (this.distance === 'innerProduct') {
          this._log(`Dropping inner product HNSW index on ${this.tableName}.`);
          const ipIndexName = `${this.tableName}_ip_hnsw_idx`;
          await client.query(`DROP INDEX IF EXISTS ${ipIndexName};`);
        } else {
          throw new Error(`Unknown distance metric ${this.distance}`);
        }
      });
    } catch (e) {
      this._log('Error dropping HNSW index:', e);
      throw e;
    }
  }

  async deleteDocumentsByIds(ids: string[], filter?: this['FilterType']): Promise<void> {
    const _filter = this._generateFiltersString(filter);
    this._log(`Deleting documents\nids=${ids}\nfilter='${_filter}'`);
    await this.transaction(async (client) => {
      await client.query(
        `DELETE FROM ${this.tableName}
        WHERE (
          id = ANY($1)
          ${_filter ? `AND (${_filter})` : ''}
        );`,
        [ids]
      );
    });
  }

  async deleteDocumentsByFilter(filter: this['FilterType']): Promise<void> {
    const _filter = this._generateFiltersString(filter);
    this._log(`Deleting documents\nfilter='${_filter}'`);
    await this.transaction(async (client) => {
      await client.query(
        `DELETE FROM ${this.tableName}
        WHERE (
          ${_filter}
        );`
      );
    });
  }

  async transaction<T>(fn: (client: Client) => Promise<T>): Promise<T> {
    let client: Client | undefined;
    try {
      client = new Client(this.readWriteUrl);
      this._log('Connecting to database');
      await client.connect();

      this._log('Beginning transaction');
      await client.query('BEGIN;');

      const response = await fn(client);

      this._log('Committing transaction');
      await client.query('COMMIT;');

      return response;
    } catch (e) {
      this._log('Error in transaction:', e);
      if (client) {
        this._log('Rolling back transaction');
        await client.query('ROLLBACK;');
      }
      throw e;
    } finally {
      if (client) {
        this._log('Closing database connection');
        await client.end();
      }
    }
  }

  async readOperation<T>(fn: (client: Client) => Promise<T>): Promise<T> {
    let client: Client | undefined;
    try {
      client = new Client(this.readOnlyUrl);

      this._log('Connecting to database');
      await client.connect();

      return await fn(client);
    } catch (e) {
      this._log('Error in read operation:', e);
      throw e;
    } finally {
      if (client) {
        this._log('Closing database connection');
        await client.end();
      }
    }
  }

  static async fromTexts(
    texts: string[],
    metadata: object[] | object,
    embeddings: Embeddings,
    dbConfig: NeonVectorStoreArgs
  ): Promise<NeonVectorStore> {
    const docs = [];
    for (let i = 0; i < texts.length; i += 1) {
      const _metadata = Array.isArray(metadata) ? metadata[i] : metadata;
      const newDoc = new Document({
        pageContent: texts[i],
        metadata: _metadata
      });
      docs.push(newDoc);
    }
    return NeonVectorStore.fromDocuments(docs, embeddings, dbConfig);
  }

  static async fromDocuments(
    docs: Document[],
    embeddings: Embeddings,
    dbConfig: NeonVectorStoreArgs
  ): Promise<NeonVectorStore> {
    const instance = await NeonVectorStore.fromConnectionString(embeddings, dbConfig);
    await instance.addDocuments(docs);
    return instance;
  }

  static async fromExistingIndex(
    embeddings: Embeddings,
    dbConfig: NeonVectorStoreArgs
  ): Promise<NeonVectorStore> {
    const instance = await NeonVectorStore.fromConnectionString(embeddings, dbConfig);
    return instance;
  }
}
