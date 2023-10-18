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

export interface NeonVectorStoreArgs {
  connectionOptions: {
    readWriteUrl: string;
    readOnlyUrl?: string;
  };
  tableName?: string;
  dimensions: number;
  filter?: Metadata;
  verbose?: boolean;
  distance?: "cosine" | "l2" | "innerProduct";
  hnswIdxM?: number;
  hnswIdxEfConstruction?: number;
}

export class NeonVectorStoreDocument extends Document {
  id: string;
  embedding: string;

  constructor(fields: {
    id: string;
    metadata?: Metadata;
    pageContent: string;
    embedding: string;
  }) {
    super(fields);
    this.id = fields.id;
    this.embedding = fields.embedding;
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
  filter?: Metadata;
  dimensions: number;
  verbose: boolean;
  distance: "l2" | "cosine" | "innerProduct";
  hnswIdxM: number;
  hnswIdxEfConstruction: number;

  readOnlyQueryFn: NeonQueryFunction<false, false>;
  readWriteQueryFn: NeonQueryFunction<false, false>;

  readOnlyClient: Client;
  readWriteClient: Client;

  _vectorstoreType(): string {
    return "neon";
  }

  private constructor(embeddings: Embeddings, fields: NeonVectorStoreArgs) {
    super(embeddings, fields);
    this.tableName = fields.tableName ?? defaultDocumentTableName;
    this.filter = fields.filter;
    this.dimensions = fields.dimensions;
    this.verbose = fields.verbose ?? false;
    this.distance = fields.distance ?? "l2";
    this.hnswIdxM = fields.hnswIdxM ?? 16;
    this.hnswIdxEfConstruction = fields.hnswIdxEfConstruction ?? 64;

    neonConfig.fetchConnectionCache = true;
    this.readOnlyQueryFn = neon(
      fields.connectionOptions.readOnlyUrl ||
        fields.connectionOptions.readWriteUrl,
      {
        readOnly: true,
      }
    );
    this.readWriteQueryFn = neon(fields.connectionOptions.readWriteUrl);

    neonConfig.webSocketConstructor = ws;
    this.readOnlyClient = new Client({
      connectionString:
        fields.connectionOptions.readOnlyUrl ||
        fields.connectionOptions.readWriteUrl,
    });
    this.readWriteClient = new Client({
      connectionString: fields.connectionOptions.readWriteUrl,
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
      for (let i = 0; i < documents.length; i += 30) {
        let sliceEnd = i + 30;
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
    const chunkSize = 100;
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

    let documents: Record<string, any>[];
    if (this.distance === "l2") {
      documents = await this.readOnlyQueryFn(
        `SELECT *, embedding ${
          distanceOperators[this.distance]
        } $1 AS "_distance"
        FROM ${this.tableName}
        WHERE metadata @> $2
        ORDER BY "_distance"
        LIMIT $3
        OFFSET $4;`,
        [embeddingString, _filter, k, _offset]
      );
    } else if (this.distance === "cosine") {
      documents = await this.readOnlyQueryFn(
        `SELECT *, 1 - (embedding ${
          distanceOperators[this.distance]
        } $1) AS "_distance"
        FROM ${this.tableName}
        WHERE metadata @> $2
        ORDER BY "_distance"
        LIMIT $3
        OFFSET $4;`,
        [embeddingString, _filter, k, _offset]
      );
    } else if (this.distance === "innerProduct") {
      documents = await this.readOnlyQueryFn(
        `SELECT *, (embedding ${
          distanceOperators[this.distance]
        } $1) * -1 AS "_distance"
        FROM ${this.tableName}
        WHERE metadata @> $2
        ORDER BY "_distance"
        LIMIT $3
        OFFSET $4;`,
        [embeddingString, _filter, k, _offset]
      );
    } else {
      throw new Error(`Unknown distance metric ${this.distance}`);
    }

    const results: [NeonVectorStoreDocument, number][] = [];
    for (const doc of documents) {
      if (doc._distance != null && doc.page_content != null) {
        const document = new NeonVectorStoreDocument({
          id: doc.id,
          metadata: doc.metadata,
          pageContent: doc.page_content,
          embedding: doc.embedding,
        });
        results.push([document, doc._distance]);
      }
    }

    this._log(
      `Found ${
        documents.length
      } similar results from vector store: ${JSON.stringify(results)}`
    );
    return results;
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

    const documentsResult = await this.readOnlyQueryFn(
      `SELECT * FROM ${this.tableName}
        WHERE id = ANY($1)
        AND metadata @> $2;`,
      [ids, _filter]
    );

    this._log(
      `Found ${
        documentsResult.length
      } documents by ids from vector store: ${JSON.stringify(documentsResult)}`
    );

    return documentsResult as NeonVectorStoreDocument[];
  }

  /**
   * Ensure that the table exists in the database.
   * Only needs to be called once. Will not overwrite existing table or index.
   */
  async ensureTableInDatabase(): Promise<void> {
    try {
      this._log("Connecting to database");
      await this.readWriteClient.connect();

      this._log("Creating vector extension");
      await this.readWriteClient.query(
        "CREATE EXTENSION IF NOT EXISTS vector;"
      );

      this._log(`Creating table ${this.tableName}`);
      await this.readWriteClient.query(`
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
        await this.readWriteClient.query(`
        CREATE INDEX IF NOT EXISTS ${l2IndexName} ON ${this.tableName}
          USING hnsw (embedding vector_l2_ops)
          WITH (m = ${this.hnswIdxM}, ef_construction = ${this.hnswIdxEfConstruction});
      `);
      } else if (this.distance === "cosine") {
        this._log(`Creating Cosine HNSW index on ${this.tableName}.`);
        const cosineIndexName = `${this.tableName}_cosine_hnsw_idx`;
        await this.readWriteClient.query(`
        CREATE INDEX IF NOT EXISTS ${cosineIndexName} ON ${this.tableName}
          USING hnsw (embedding vector_cosine_ops)
          WITH (m = ${this.hnswIdxM}, ef_construction = ${this.hnswIdxEfConstruction});
      `);
      } else if (this.distance === "innerProduct") {
        this._log(`Creating inner product HNSW index on ${this.tableName}.`);
        const ipIndexName = `${this.tableName}_ip_hnsw_idx`;
        await this.readWriteClient.query(`
        CREATE INDEX IF NOT EXISTS ${ipIndexName} ON ${this.tableName}
          USING hnsw (embedding vector_ip_ops)
          WITH (m = ${this.hnswIdxM}, ef_construction = ${this.hnswIdxEfConstruction});
      `);
      }

      this._log("Disabling sequential scans. Enabling index scans.");
      await this.readWriteClient.query(
        "SET enable_seqscan = OFF; SET enable_indexscan = ON;"
      );
    } finally {
      this._log("Closing database connection");
      await this.readWriteClient.end();
    }
  }

  async deleteTableInDatabase(): Promise<void> {
    this._log(`Dropping table ${this.tableName}`);
    await this.readWriteQueryFn(`DROP TABLE IF EXISTS ${this.tableName};`);
  }

  async dropHnswIndex(): Promise<void> {
    try {
      await this.readWriteClient.connect();
      if (this.distance === "l2") {
        this._log(`Dropping L2 HNSW index on ${this.tableName}.`);
        const l2IndexName = `${this.tableName}_l2_hnsw_idx`;
        await this.readWriteClient.query(
          `DROP INDEX IF EXISTS ${l2IndexName};`
        );
      } else if (this.distance === "cosine") {
        this._log(`Dropping Cosine HNSW index on ${this.tableName}.`);
        const cosineIndexName = `${this.tableName}_cosine_hnsw_idx`;
        await this.readWriteClient.query(
          `DROP INDEX IF EXISTS ${cosineIndexName};`
        );
      } else if (this.distance === "innerProduct") {
        this._log(`Dropping inner product HNSW index on ${this.tableName}.`);
        const ipIndexName = `${this.tableName}_ip_hnsw_idx`;
        await this.readWriteClient.query(
          `DROP INDEX IF EXISTS ${ipIndexName};`
        );
      }
    } finally {
      this._log("Closing database connection");
      await this.readWriteClient.end();
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
