import { NeonQueryFunction, neon, neonConfig } from "@neondatabase/serverless";
import { Metadata } from "@opensearch-project/opensearch/api/types";
import { Document } from "langchain/document";
import { Embeddings } from "langchain/embeddings";
import { VectorStore } from "langchain/vectorstores";

export interface NeonVectorStoreArgs {
  connectionOptions: {
    readWriteUrl: string;
    readOnlyUrl?: string;
  };
  tableName?: string;
  dimensions: number;
  filter?: Metadata;
}

export class NeonVectorStoreDocument extends Document {
  id?: string;
  embedding?: string;
}

const defaultDocumentTableName = "documents";

export class NeonVectorStore extends VectorStore {
  declare FilterType: Metadata;
  tableName: string;
  filter?: Metadata;
  dimensions: number;

  neonRead: NeonQueryFunction<false, false>;
  neonWrite: NeonQueryFunction<false, false>;

  _vectorstoreType(): string {
    return "neon";
  }

  private constructor(embeddings: Embeddings, fields: NeonVectorStoreArgs) {
    super(embeddings, fields);
    this.tableName = fields.tableName ?? defaultDocumentTableName;
    this.filter = fields.filter;
    this.dimensions = fields.dimensions;

    neonConfig.fetchConnectionCache = true;
    this.neonRead = neon(
      fields.connectionOptions.readOnlyUrl ??
        fields.connectionOptions.readWriteUrl
    );
    this.neonWrite = neon(fields.connectionOptions.readWriteUrl);
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
    // This will create the table if it does not exist. We can call it every time as it doesn't
    // do anything if the table already exists, and it is not expensive in terms of performance
    await this.ensureTableInDatabase();
    return this.addVectors(
      await this.embeddings.embedDocuments(texts),
      documents
    );
  }

  async addVectors(vectors: number[][], documents: Document[]): Promise<void> {
    const rows = vectors.map((embedding, idx) => {
      const embeddingString = `[${embedding.join(",")}]`;
      const documentRow = {
        pageContent: documents[idx].pageContent,
        embedding: embeddingString,
        metadata: documents[idx].metadata,
      };

      return documentRow;
    });

    const chunkSize = 500;
    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize);

      try {
        await this.neonWrite(
          `
          INSERT INTO ${this.tableName} (pageContent, embedding, metadata)
          SELECT * FROM jsonb_to_recordset($1::jsonb)
          AS x(pageContent text, embedding real[], metadata jsonb);
        `,
          [JSON.stringify(chunk)]
        );
      } catch (e) {
        console.error(e);
        throw new Error(`Error inserting: ${chunk[0].pageContent}`);
      }
    }
  }

  async similaritySearchVectorWithScore(
    query: number[],
    k: number,
    filter?: this["FilterType"]
  ): Promise<[NeonVectorStoreDocument, number][]> {
    const embeddingString = `[${query.join(",")}]`;
    const _filter = filter ?? "{}";

    const queryString = `
      SELECT *, embedding <-> $1 as "_distance"
      FROM ${this.tableName}
      WHERE metadata @> $2
      ORDER BY "_distance" ASC
      LIMIT $3;`;

    const documents = await this.neonRead(queryString, [
      embeddingString,
      _filter,
      k,
    ]);

    const results = [] as [NeonVectorStoreDocument, number][];
    for (const doc of documents) {
      if (doc._distance != null && doc.pageContent != null) {
        const document = new Document({
          metadata: doc.metadata,
          pageContent: doc.pageContent,
        }) as NeonVectorStoreDocument;
        document.id = doc.id;
        results.push([document, doc._distance]);
      }
    }

    return results;
  }

  async ensureTableInDatabase(): Promise<void> {
    await this.neonWrite("CREATE EXTENSION IF NOT EXISTS embedding;");
    await this.neonWrite('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
    await this.neonWrite(`
      CREATE TABLE IF NOT EXISTS ${this.tableName} (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
        "pageContent" text,
        metadata jsonb,
        embedding real[],
      );
    `);
    await this.neonWrite(`
      CREATE INDEX IF NOT EXISTS ON documents
        USING hnsw(embedding)
        WITH (
          dims=${this.dimensions}, 
          m=52, 
          efconstruction=64, 
          efsearch=30
        );
      SET enable_seqscan = off;
    `);
  }

  static async fromTexts(
    texts: string[],
    metadatas: object[] | object,
    embeddings: Embeddings,
    dbConfig: NeonVectorStoreArgs
  ): Promise<NeonVectorStore> {
    const docs = [];
    for (let i = 0; i < texts.length; i += 1) {
      const metadata = Array.isArray(metadatas) ? metadatas[i] : metadatas;
      const newDoc = new Document({
        pageContent: texts[i],
        metadata,
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
