import { Document } from "langchain/document";
import { envConfig, vectorDBConfig } from "../configs/index";
import { SourceDocument } from "../database/model";
import { NeonVectorStore } from "../vector-db/neon";
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
): Promise<SourceDocument | undefined> {
  const vectorStore = await getDocumentVectorStore();
  const sourceDocuments = (await vectorStore.neonRead(
    `SELECT * FROM ${vectorStore.tableName} WHERE id = $1;`,
    [sourceDocumentId]
  )) as SourceDocument[];
  return sourceDocuments[0];
}

export async function getSourceDocuments(
  sourceDocumentIds: string[]
): Promise<SourceDocument[]> {
  const vectorStore = await getDocumentVectorStore();
  const sourceDocuments = (await vectorStore.neonRead(
    `SELECT * FROM ${vectorStore.tableName} WHERE id = ANY($1);`,
    [sourceDocumentIds]
  )) as SourceDocument[];
  return sourceDocuments;
}
