import type { QueryResult } from "@neondatabase/serverless";
import {
  Client,
  neon,
  neonConfig,
  type NeonQueryFunction,
} from "@neondatabase/serverless";
import type { Metadata } from "@opensearch-project/opensearch/api/types";
import { Document } from "langchain/document";
import type { Embeddings } from "langchain/embeddings/base";
import { VectorStore } from "langchain/vectorstores/base";
import ws from "ws";

export type DistanceMetric = "l2" | "cosine" | "innerProduct";

export interface NeonVectorStoreArgs {
  connectionOptions: {
    readWriteUrl: string;
    readOnlyUrl?: string;
  };
  tableName?: string;
  dimensions: number;
  filters?: Metadata[];
  verbose?: boolean;
  distance?: DistanceMetric;
  hnswIdxM?: number;
  hnswIdxEfConstruction?: number;
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

const defaultDocumentTableName = "documents";

const distanceOperators = {
  l2: "<->",
  cosine: "<=>",
  innerProduct: "<#>",
};

export class NeonVectorStore extends VectorStore {
  declare FilterType: Metadata;
  tableName: string;
  filters: Metadata[];
  dimensions: number;
  verbose: boolean;
  distance: DistanceMetric;
  hnswIdxM: number;
  hnswIdxEfConstruction: number;

  readOnlyUrl: string;
  readOnlyQueryFn: NeonQueryFunction<false, false>;

  readWriteUrl: string;
  readWriteQueryFn: NeonQueryFunction<false, false>;

  _vectorstoreType(): string {
    return "neon";
  }

  private constructor(embeddings: Embeddings, fields: NeonVectorStoreArgs) {
    super(embeddings, fields);
    this.tableName = fields.tableName ?? defaultDocumentTableName;
    this.filters = fields.filters ?? [];
    this.dimensions = fields.dimensions;
    this.verbose = fields.verbose ?? false;
    this.distance = fields.distance ?? "l2";
    this.hnswIdxM = fields.hnswIdxM ?? 16;
    this.hnswIdxEfConstruction = fields.hnswIdxEfConstruction ?? 64;

    neonConfig.webSocketConstructor = ws;

    this.readOnlyUrl =
      fields.connectionOptions.readOnlyUrl ||
      fields.connectionOptions.readWriteUrl;
    this.readOnlyQueryFn = neon(this.readOnlyUrl, {
      readOnly: true,
    });

    this.readWriteUrl = fields.connectionOptions.readWriteUrl;
    this.readWriteQueryFn = neon(this.readWriteUrl, {
      readOnly: false,
    });
  }

  _log(message: any, ...optionalParams: any[]): void {
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

  _generateFiltersString(): string {
    if (this.filters.length > 0) {
      return `AND (
        ${this.filters
          .map((value) => `(metadata @> '${JSON.stringify(value)}')`)
          .join(" OR ")}
        )`;
    }
    return "";
  }

  async addDocuments(documents: Document[]): Promise<void> {
    if (documents.length === 0) {
      this._log(`No documents to add to vector store`);
    } else if (documents.length === 1) {
      this._log(`Adding single document to vector store`);
      await this.addVectors(
        await this.embeddings.embedDocuments(
          documents.map(({ pageContent }) => pageContent)
        ),
        documents
      );
    } else {
      const sliceSize = 25;
      for (let i = 0; i < documents.length; i += sliceSize) {
        let sliceEnd = i + sliceSize;
        if (sliceEnd >= documents.length) {
          sliceEnd = documents.length - 1;
        }
        const docsSlice = documents.slice(i, sliceEnd);
        this._log(
          `Adding slice of documents to vector store: ${i} to ${sliceEnd}`
        );
        await this.addVectors(
          await this.embeddings.embedDocuments(
            docsSlice.map(({ pageContent }) => pageContent)
          ),
          docsSlice
        );
      }
    }
  }

  async addVectors(vectors: number[][], documents: Document[]): Promise<void> {
    const rows = vectors.map((embedding, idx) => {
      const embeddingString = `[${embedding.join(",")}]`;
      const documentRow = {
        page_content: documents[idx].pageContent,
        embedding: embeddingString,
        metadata: documents[idx].metadata,
      };
      return documentRow;
    });

    const errors: any[] = [];
    const chunkSize = 25;
    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize);
      this._log(
        `Inserting ${chunk.length} rows into vector store: ${JSON.stringify(
          chunk
        )}`
      );

      try {
        await this.readWriteQueryFn(
          `INSERT INTO ${this.tableName} (page_content, embedding, metadata)
          SELECT * FROM jsonb_to_recordset($1::jsonb)
          AS x(page_content text, embedding vector(${this.dimensions}), metadata jsonb);`,
          [JSON.stringify(chunk)]
        );
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
    filter?: this["FilterType"],
    offset?: number
  ): Promise<[NeonVectorStoreDocument, number][]> {
    const embeddingString = `[${query.join(",")}]`;
    const _filter = filter ?? "{}";
    const _offset = offset ?? 0;
    this._log(
      `Searching for ${k} similar results from vector store with filter ${JSON.stringify(
        _filter
      )}`
    );

    let client: Client | undefined;
    try {
      client = new Client(this.readOnlyUrl);

      this._log("Connecting to database");
      await client.connect();

      let documents: QueryResult<any>;
      if (this.distance === "l2") {
        documents = await client.query(
          `SELECT *, embedding ${
            distanceOperators[this.distance]
          } $1 AS "_distance"
        FROM ${this.tableName}
        WHERE (
          (metadata @> $2)
          ${this._generateFiltersString()}
        )
        ORDER BY "_distance" ASC
        LIMIT $3
        OFFSET $4;`,
          [embeddingString, _filter, k, _offset]
        );
      } else if (this.distance === "cosine") {
        documents = await client.query(
          `SELECT *, embedding ${
            distanceOperators[this.distance]
          } $1 AS "_distance"
        FROM ${this.tableName}
        WHERE (
          (metadata @> $2)
          ${this._generateFiltersString()}
        )
        ORDER BY "_distance" ASC
        LIMIT $3
        OFFSET $4;`,
          [embeddingString, _filter, k, _offset]
        );
      } else if (this.distance === "innerProduct") {
        documents = await client.query(
          `SELECT *, (embedding ${
            distanceOperators[this.distance]
          } $1) * -1 AS "_distance"
        FROM ${this.tableName}
        WHERE (
          (metadata @> $2)
          ${this._generateFiltersString()}
        )
        ORDER BY "_distance" DESC
        LIMIT $3
        OFFSET $4;`,
          [embeddingString, _filter, k, _offset]
        );
      } else {
        throw new Error(`Unknown distance metric ${this.distance}`);
      }

      const results: [NeonVectorStoreDocument, number][] = [];
      for (const doc of documents.rows) {
        if (doc._distance != null && doc.page_content != null) {
          const document = new NeonVectorStoreDocument({
            id: doc.id,
            metadata: doc.metadata,
            pageContent: doc.page_content,
            embedding: doc.embedding,
            distance: doc._distance,
            distanceMetric: this.distance,
          });
          results.push([document, doc._distance]);
        }
      }

      this._log(
        `Found ${
          documents.rows.length
        } similar results from vector store: ${JSON.stringify(results)}`
      );
      return results;
    } catch (e) {
      this._log(`Error searching vector store: ${e}`);
      throw e;
    } finally {
      if (client) {
        this._log("Closing database connection");
        await client.end();
      }
    }
  }

  async getDocumentsByIds(
    ids: string[],
    filter?: this["FilterType"]
  ): Promise<NeonVectorStoreDocument[]> {
    const _filter = filter ?? "{}";
    this._log(
      `Getting documents by ids from vector store with filter ${JSON.stringify(
        _filter
      )}`
    );

    let client: Client | undefined;
    try {
      client = new Client(this.readOnlyUrl);

      this._log("Connecting to database");
      await client.connect();

      const documentsResult = await client.query(
        `SELECT * FROM ${this.tableName}
        WHERE (
          id = ANY($1)
          AND (
            (metadata @> $2)
            ${this._generateFiltersString()}
          )
        );`,
        [ids, _filter]
      );

      this._log(
        `Found ${
          documentsResult.rows.length
        } documents by ids from vector store: ${JSON.stringify(
          documentsResult.rows
        )}`
      );
      return documentsResult.rows.map((row) => {
        return new NeonVectorStoreDocument({
          id: row.id,
          metadata: row.metadata,
          pageContent: row.page_content,
          embedding: row.embedding,
        });
      });
    } catch (e) {
      this._log(`Error getting documents by ids from vector store: ${e}`);
      throw e;
    } finally {
      if (client) {
        this._log("Closing database connection");
        await client.end();
      }
    }
  }

  /**
   * Ensure that the table exists in the database.
   * Only needs to be called once. Will not overwrite existing table or index.
   */
  async ensureTableInDatabase(): Promise<void> {
    let client: Client | undefined;
    try {
      client = new Client(this.readWriteUrl);

      this._log("Connecting to database");
      await client.connect();

      this._log("Creating vector extension");
      await client.query("CREATE EXTENSION IF NOT EXISTS vector;");

      this._log(`Creating table ${this.tableName}`);
      await client.query(`
        CREATE TABLE IF NOT EXISTS ${this.tableName} (
          "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
          page_content text,
          metadata jsonb,
          embedding vector(${this.dimensions})
        );
      `);

      if (this.distance === "l2") {
        this._log(`Creating L2 HNSW index on ${this.tableName}.`);
        const l2IndexName = `${this.tableName}_l2_hnsw_idx`;
        await client.query(`
        CREATE INDEX IF NOT EXISTS ${l2IndexName} ON ${this.tableName}
          USING hnsw (embedding vector_l2_ops)
          WITH (m = ${this.hnswIdxM}, ef_construction = ${this.hnswIdxEfConstruction});
      `);
      } else if (this.distance === "cosine") {
        this._log(`Creating Cosine HNSW index on ${this.tableName}.`);
        const cosineIndexName = `${this.tableName}_cosine_hnsw_idx`;
        await client.query(`
        CREATE INDEX IF NOT EXISTS ${cosineIndexName} ON ${this.tableName}
          USING hnsw (embedding vector_cosine_ops)
          WITH (m = ${this.hnswIdxM}, ef_construction = ${this.hnswIdxEfConstruction});
      `);
      } else if (this.distance === "innerProduct") {
        this._log(`Creating inner product HNSW index on ${this.tableName}.`);
        const ipIndexName = `${this.tableName}_ip_hnsw_idx`;
        await client.query(`
        CREATE INDEX IF NOT EXISTS ${ipIndexName} ON ${this.tableName}
          USING hnsw (embedding vector_ip_ops)
          WITH (m = ${this.hnswIdxM}, ef_construction = ${this.hnswIdxEfConstruction});
      `);
      } else {
        throw new Error(`Unknown distance metric ${this.distance}`);
      }
    } catch (e) {
      this._log("Error ensuring table in database:", e);
      throw e;
    } finally {
      if (client) {
        this._log("Closing database connection");
        await client.end();
      }
    }
  }

  async deleteTableInDatabase(): Promise<void> {
    this._log(`Dropping table ${this.tableName}`);
    await this.readWriteQueryFn(
      `DROP TABLE IF EXISTS ${this.tableName} CASCADE;`
    );
  }

  async dropHnswIndex(): Promise<void> {
    let client: Client | undefined;
    try {
      client = new Client(this.readWriteUrl);

      this._log("Connecting to database");
      await client.connect();

      if (this.distance === "l2") {
        this._log(`Dropping L2 HNSW index on ${this.tableName}.`);
        const l2IndexName = `${this.tableName}_l2_hnsw_idx`;
        await client.query(`DROP INDEX IF EXISTS ${l2IndexName};`);
      } else if (this.distance === "cosine") {
        this._log(`Dropping Cosine HNSW index on ${this.tableName}.`);
        const cosineIndexName = `${this.tableName}_cosine_hnsw_idx`;
        await client.query(`DROP INDEX IF EXISTS ${cosineIndexName};`);
      } else if (this.distance === "innerProduct") {
        this._log(`Dropping inner product HNSW index on ${this.tableName}.`);
        const ipIndexName = `${this.tableName}_ip_hnsw_idx`;
        await client.query(`DROP INDEX IF EXISTS ${ipIndexName};`);
      } else {
        throw new Error(`Unknown distance metric ${this.distance}`);
      }
    } catch (e) {
      this._log("Error dropping HNSW index:", e);
      throw e;
    } finally {
      if (client) {
        this._log("Closing database connection");
        await client.end();
      }
    }
  }

  async deleteDocumentsByIds(ids: string[]): Promise<void> {
    this._log(`Deleting documents by ids from vector store: ${ids}`);
    await this.readWriteQueryFn(
      `DELETE FROM ${this.tableName}
      WHERE id = ANY($1);`,
      [ids]
    );
  }

  async deleteDocumentsByFilter(filter: this["FilterType"]): Promise<void> {
    this._log(
      `Deleting documents by filter from vector store: ${JSON.stringify(
        filter
      )}`
    );
    await this.readWriteQueryFn(
      `DELETE FROM ${this.tableName}
      WHERE (
        metadata @> $1
        ${this._generateFiltersString()}
      );`,
      [filter]
    );
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
        metadata: _metadata,
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
    const instance = await NeonVectorStore.fromConnectionString(
      embeddings,
      dbConfig
    );
    await instance.addDocuments(docs);
    return instance;
  }

  static async fromExistingIndex(
    embeddings: Embeddings,
    dbConfig: NeonVectorStoreArgs
  ): Promise<NeonVectorStore> {
    const instance = await NeonVectorStore.fromConnectionString(
      embeddings,
      dbConfig
    );
    return instance;
  }
}
