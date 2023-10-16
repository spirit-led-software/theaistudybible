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
  distance?: "cosine" | "l2" | "manhattan";
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
  manhattan: "<~>",
};

export class NeonVectorStore extends VectorStore {
  declare FilterType: Metadata;
  tableName: string;
  filter?: Metadata;
  dimensions: number;
  verbose: boolean;
  distance: "l2" | "cosine" | "manhattan";

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
    this.distance = fields.distance ?? "cosine";

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

  log(message: string, ...optionalParams: any[]): void {
    if (this.verbose) {
      console.log(`[NeonVectorStore] ${message}`, optionalParams);
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
      this.log(`No documents to add to vector store`);
    } else if (documents.length === 1) {
      this.log(`Adding single document to vector store`);
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
        this.log(
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
      const embeddingString = `{${embedding.join(",")}}`;
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
      this.log(
        `Inserting ${chunk.length} rows into vector store: ${JSON.stringify(
          chunk
        )}`
      );

      try {
        await this.readWriteQueryFn(
          `INSERT INTO ${this.tableName} (page_content, embedding, metadata)
          SELECT * FROM jsonb_to_recordset($1::jsonb)
          AS x(page_content text, embedding real[], metadata jsonb);`,
          [JSON.stringify(chunk)]
        );
      } catch (e) {
        this.log(`Error inserting chunk: ${e}`);
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
    const embeddingString = `{${query.join(",")}}`;
    const _filter = filter ?? "{}";
    const _offset = offset ?? 0;
    this.log(
      `Searching for ${k} similar results from vector store with filter ${JSON.stringify(
        _filter
      )}`
    );

    const documents = await this.readOnlyQueryFn(
      `SELECT *, embedding ${distanceOperators[this.distance]} $1 AS "_distance"
        FROM ${this.tableName}
        WHERE metadata @> $2
        ORDER BY "_distance" ASC
        LIMIT $3
        OFFSET $4;`,
      [embeddingString, _filter, k, _offset]
    );

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

    this.log(
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
    this.log(
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

    this.log(
      `Found ${
        documentsResult.length
      } documents by ids from vector store: ${JSON.stringify(documentsResult)}`
    );

    return documentsResult as NeonVectorStoreDocument[];
  }

  /**
   * Ensure that the table exists in the database.
   * Only needs to be called once. Will not overwrite existing table.
   * But will recreate the HNSW index.
   * https://neon.tech/docs/extensions/pg_embedding
   */
  async ensureTableInDatabase(): Promise<void> {
    try {
      this.log("Connecting to database");
      await this.readWriteClient.connect();

      this.log("Creating embedding extension");
      await this.readWriteClient.query(
        "CREATE EXTENSION IF NOT EXISTS embedding;"
      );

      this.log(`Creating table ${this.tableName}`);
      await this.readWriteClient.query(`
        CREATE TABLE IF NOT EXISTS ${this.tableName} (
          "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
          page_content text,
          metadata jsonb,
          embedding real[]
        );
      `);

      this.log(`Creating HNSW index on ${this.tableName}. Drop if exists`);
      const indexName = `${this.tableName}_hnsw_idx`;
      await this.readWriteClient.query(`DROP INDEX IF EXISTS ${indexName};`);
      await this.readWriteClient.query(
        `CREATE INDEX IF NOT EXISTS ${indexName} ON ${this.tableName}
          USING hnsw(embedding)
          WITH (
            dims=${this.dimensions}, 
            m=64,
            efconstruction=128, 
            efsearch=256
          );
      `
      );

      this.log("Turning off seq scan");
      await this.readWriteClient.query("SET enable_seqscan = off;");
    } finally {
      this.log("Closing database connection");
      await this.readWriteClient.end();
    }
  }

  async deleteTableInDatabase(): Promise<void> {
    this.log(`Dropping table ${this.tableName}`);
    await this.readWriteQueryFn(`DROP TABLE IF EXISTS ${this.tableName};`);
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
