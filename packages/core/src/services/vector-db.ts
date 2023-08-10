import { Document } from "langchain/document";
import { TypeORMVectorStore } from "langchain/vectorstores/typeorm";
import { vectorDBConfig } from "../configs/index";
import { SourceDocument } from "../database/model";
import { getEmbeddingsModel } from "./llm";

export async function getVectorStore() {
  const vectorStore = await TypeORMVectorStore.fromDataSource(
    getEmbeddingsModel(),
    {
      tableName: vectorDBConfig.collectionName,
      postgresConnectionOptions: {
        type: "postgres",
        replication: {
          master: {
            url: vectorDBConfig.writeUrl,
          },
          slaves: [
            {
              url: vectorDBConfig.readUrl,
            },
          ],
        },
      },
    }
  );
  await vectorStore.ensureTableInDatabase();
  return vectorStore;
}

export async function addDocumentsToVectorStore(
  documents: Document<Record<string, any>>[]
) {
  const vectorStore = await getVectorStore();
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
  const vectorStore = await getVectorStore();
  const queryString = `
SELECT * FROM ${vectorStore.tableName} 
WHERE id = $1;`;
  const sourceDocuments = await vectorStore.appDataSource.query(queryString, [
    sourceDocumentId,
  ]);
  return sourceDocuments[0];
}
