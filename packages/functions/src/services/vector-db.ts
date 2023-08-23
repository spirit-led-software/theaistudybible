import { envConfig, vectorDBConfig } from "@core/configs";
import { NeonVectorStore, NeonVectorStoreDocument } from "@core/vector-db/neon";
import { Document } from "langchain/document";
import { getEmbeddingsModel } from "./llm";

export async function getDocumentVectorStore(verbose?: boolean) {
  const vectorStore = await NeonVectorStore.fromConnectionString(
    getEmbeddingsModel(),
    {
      tableName: vectorDBConfig.documents.tableName,
      connectionOptions: {
        readWriteUrl: vectorDBConfig.writeUrl,
        readOnlyUrl: vectorDBConfig.readUrl,
      },
      dimensions: vectorDBConfig.documents.dimensions,
      verbose: envConfig.isLocal ? true : verbose,
    }
  );
  return vectorStore;
}

export async function addDocumentsToVectorStore(
  documents: Document<Record<string, any>>[]
) {
  const vectorStore = await getDocumentVectorStore();
  for (let i = 0; i < documents.length; i += 30) {
    if (i + 30 > documents.length) {
      console.log(`Adding slice: ${i} to ${documents.length}`);
      await vectorStore.addDocuments(documents.slice(i, documents.length));
      break;
    }
    console.log(`Adding slice: ${i} to ${i + 30}`);
    await vectorStore.addDocuments(documents.slice(i, i + 30));
  }
}

export async function getSourceDocument(
  sourceDocumentId: string
): Promise<NeonVectorStoreDocument | undefined> {
  const vectorStore = await getDocumentVectorStore();
  const sourceDocumentsResult = await vectorStore.readPool.query(
    `SELECT * FROM ${vectorStore.tableName} WHERE id = ${sourceDocumentId};`
  );
  return sourceDocumentsResult.rows[0] as NeonVectorStoreDocument;
}

export async function getSourceDocuments(
  sourceDocumentIds: string[]
): Promise<NeonVectorStoreDocument[]> {
  const vectorStore = await getDocumentVectorStore();
  const sourceDocumentsResult = await vectorStore.readPool.query(
    `SELECT * FROM ${vectorStore.tableName} WHERE id = ANY(${sourceDocumentIds});`
  );
  return sourceDocumentsResult.rows as NeonVectorStoreDocument[];
}
