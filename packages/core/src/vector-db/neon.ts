import { Metadata } from "@opensearch-project/opensearch/api/types";
import { Document } from "langchain/document";
import { Embeddings } from "langchain/embeddings";
import { VectorStore } from "langchain/vectorstores/base";
import { Pool } from "pg";

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

  readPool: Pool;
  writePool: Pool;

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

    this.readPool = new Pool({
      connectionString:
        fields.connectionOptions.readOnlyUrl ||
        fields.connectionOptions.readWriteUrl,
      ssl: true,
      log: this.verbose ? console.log : undefined,
    });
    this.writePool = new Pool({
      connectionString: fields.connectionOptions.readWriteUrl,
      ssl: true,
      log: this.verbose ? console.log : undefined,
    });
  }

  static async fromConnectionString(
    embeddings: Embeddings,
    fields: NeonVectorStoreArgs
  ): Promise<NeonVectorStore> {
    const neonVectorStore = new NeonVectorStore(embeddings, fields);
    return neonVectorStore;
  }

  async addDocuments(documents: Document[]): Promise<void> {
    for (let i = 0; i < documents.length; i += 30) {
      let sliceEnd = i + 30;
      if (sliceEnd >= documents.length) {
        sliceEnd = documents.length - 1;
      }
      const docsSlice = documents.slice(i, sliceEnd);
      console.log(`Adding slice: ${i} to ${sliceEnd}`);
      const texts = docsSlice.map(({ pageContent }) => pageContent);
      await this.addVectors(
        await this.embeddings.embedDocuments(texts),
        docsSlice
      );
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

    const chunkSize = 500;
    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize);
      if (this.verbose) {
        console.log(
          `Inserting ${chunk.length} rows into vector store: ${JSON.stringify(
            chunk
          )}`
        );
      }

      try {
        await this.writePool.query(
          `INSERT INTO ${this.tableName} (page_content, embedding, metadata)
          SELECT * FROM jsonb_to_recordset($1::jsonb)
          AS x(page_content text, embedding real[], metadata jsonb);`,
          [JSON.stringify(chunk)]
        );
      } catch (e) {
        throw new Error(`Error inserting: ${chunk[0].page_content}`);
      }
    }
  }

  async similaritySearchVectorWithScore(
    query: number[],
    k: number,
    filter?: this["FilterType"]
  ): Promise<[NeonVectorStoreDocument, number][]> {
    const embeddingString = `{${query.join(",")}}`;
    const _filter = filter ?? "{}";
    if (this.verbose) {
      console.log(
        `Searching for ${k} similar results from vector store with filter ${JSON.stringify(
          _filter
        )}`
      );
    }

    const documents = await this.readPool.query(
      `SELECT *, embedding ${distanceOperators[this.distance]} $1 AS "_distance"
        FROM ${this.tableName}
        WHERE metadata @> $2
        ORDER BY "_distance" ASC
        LIMIT $3;`,
      [embeddingString, _filter, k]
    );

    const results: [NeonVectorStoreDocument, number][] = [];
    for (const doc of documents.rows) {
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

    if (this.verbose) {
      console.log(
        `Found ${
          documents.rows.length
        } similar results from vector store: ${JSON.stringify(results)}`
      );
    }
    return results;
  }

  async getDocumentsByIds(
    ids: string[],
    filter?: this["FilterType"]
  ): Promise<NeonVectorStoreDocument[]> {
    const _filter = filter ?? "{}";
    if (this.verbose) {
      console.log(
        `Getting documents by ids from vector store with filter ${JSON.stringify(
          _filter
        )}`
      );
    }

    const documentsResult = await this.readPool.query(
      `SELECT * FROM ${this.tableName}
        WHERE id = ANY($1)
        AND metadata @> $2;`,
      [ids, _filter]
    );

    if (this.verbose) {
      console.log(
        `Found ${
          documentsResult.rows.length
        } documents by ids from vector store: ${JSON.stringify(
          documentsResult.rows
        )}`
      );
    }

    return documentsResult.rows as NeonVectorStoreDocument[];
  }

  /**
   * Ensure that the table exists in the database.
   * Only needs to be called once. Will not overwrite existing table.
   * But will recreate the HNSW index.
   * https://neon.tech/docs/extensions/pg_embedding
   */
  async ensureTableInDatabase(): Promise<void> {
    const client = await this.writePool.connect();
    try {
      if (this.verbose) {
        console.log("Creating embedding extension");
      }
      await client.query("CREATE EXTENSION IF NOT EXISTS embedding;");

      if (this.verbose) {
        console.log(`Creating table ${this.tableName}`);
      }
      await client.query(`
        CREATE TABLE IF NOT EXISTS ${this.tableName} (
          "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
          page_content text,
          metadata jsonb,
          embedding real[]
        );
      `);

      if (this.verbose) {
        console.log(`Creating HNSW index on ${this.tableName}. Drop if exists`);
      }
      const indexName = `${this.tableName}_hnsw_idx`;
      await client.query(`DROP INDEX IF EXISTS ${indexName};`);
      await client.query(`
        CREATE INDEX IF NOT EXISTS ${indexName} ON ${this.tableName}
          USING hnsw(embedding)
          WITH (
            dims=${this.dimensions}, 
            m=64,
            efconstruction=128, 
            efsearch=256
          );
      `);

      if (this.verbose) {
        console.log("Turning off seq scan");
      }
      await client.query("SET enable_seqscan = off;");
    } catch (e) {
      throw e;
    } finally {
      await client.release();
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
