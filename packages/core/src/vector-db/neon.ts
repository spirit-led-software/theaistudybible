import { Metadata } from "@opensearch-project/opensearch/api/types";
import { Document } from "langchain/document";
import { Embeddings } from "langchain/embeddings";
import { VectorStore } from "langchain/vectorstores/base";
import postgres from "postgres";

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
  id?: string;
  embedding?: string;
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

  neonRead: postgres.Sql<{}>;
  neonWrite: postgres.Sql<{}>;

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

    this.neonRead = postgres(
      fields.connectionOptions.readOnlyUrl ??
        fields.connectionOptions.readWriteUrl
    );
    this.neonWrite = postgres(fields.connectionOptions.readWriteUrl);
  }

  static async fromConnectionString(
    embeddings: Embeddings,
    fields: NeonVectorStoreArgs
  ): Promise<NeonVectorStore> {
    const neonVectorStore = new NeonVectorStore(embeddings, fields);
    return neonVectorStore;
  }

  async addDocuments(documents: Document[]): Promise<void> {
    const texts = documents.map(({ pageContent }) => pageContent);
    return this.addVectors(
      await this.embeddings.embedDocuments(texts),
      documents
    );
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
        await this.neonWrite`
          INSERT INTO ${this.tableName} (page_content, embedding, metadata)
          SELECT * FROM jsonb_to_recordset(${JSON.stringify(chunk)}::jsonb)
          AS x(page_content text, embedding real[], metadata jsonb);`;
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

    const documents = await this.neonRead`
      SELECT id, page_content, metadata, embedding ${
        distanceOperators[this.distance]
      } ${embeddingString} AS _distance
      FROM ${this.tableName}
      WHERE metadata @> ${_filter.toString()}
      ORDER BY embedding ${distanceOperators[this.distance]} ${embeddingString}
      LIMIT ${k.toString()};
    `;

    const results = [] as [NeonVectorStoreDocument, number][];
    for (const doc of documents) {
      if (doc._distance != null && doc.page_content != null) {
        const document = new Document({
          metadata: doc.metadata,
          pageContent: doc.page_content,
        }) as NeonVectorStoreDocument;
        document.id = doc.id;
        results.push([document, doc._distance]);
      }
    }

    if (this.verbose) {
      console.log(
        `Found ${
          documents.length
        } similar results from vector store: ${JSON.stringify(results)}`
      );
    }
    return results;
  }

  /**
   * Ensure that the table exists in the database.
   * Only needs to be called once. Will not overwrite existing table.
   * But will recreate the HNSW index.
   * https://neon.tech/docs/extensions/pg_embedding
   */
  async ensureTableInDatabase(): Promise<void> {
    if (this.verbose) {
      console.log("Creating embedding extension");
    }
    await this.neonWrite`CREATE EXTENSION IF NOT EXISTS embedding;`;

    if (this.verbose) {
      console.log(`Creating table ${this.tableName}`);
    }
    await this.neonWrite`
      CREATE TABLE IF NOT EXISTS ${this.tableName} (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        page_content text,
        metadata jsonb,
        embedding real[]
      );
    `;

    if (this.verbose) {
      console.log(`Creating HNSW index on ${this.tableName}. Drop if exists`);
    }
    const indexName = `${this.tableName}_hnsw_idx`;
    await this.neonWrite`
      DROP INDEX IF EXISTS ${indexName};
    `;
    await this.neonWrite`
      CREATE INDEX IF NOT EXISTS ${indexName} ON ${this.tableName}
        USING hnsw(embedding)
        WITH (
          dims=${this.dimensions}, 
          m=64,
          efconstruction=128, 
          efsearch=256
        );
    `;

    if (this.verbose) {
      console.log("Turning off seq scan");
    }
    await this.neonWrite`
      SET enable_seqscan = off;
    `;
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
