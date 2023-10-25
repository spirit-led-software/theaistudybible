import { envConfig, vectorDBConfig } from "@core/configs";
import { NeonVectorStore } from "@core/langchain/vectorstores/neon";
import { getEmbeddingsModel } from "./llm";

export async function getDocumentVectorStore(options?: { verbose?: boolean }) {
  const { verbose } = options ?? {};
  const vectorStore = await NeonVectorStore.fromConnectionString(
    getEmbeddingsModel(),
    {
      tableName: "documents",
      connectionOptions: {
        readWriteUrl: vectorDBConfig.writeUrl,
        readOnlyUrl: vectorDBConfig.readUrl,
      },
      dimensions: 1536, //! Must match embedding model output size. See ./llm.ts
      distance: "cosine",
      hnswIdxM: 16,
      hnswIdxEfConstruction: 64,
      verbose: envConfig.isLocal ? true : verbose,
    }
  );
  return vectorStore;
}

export async function getChatMemoryVectorStore(
  chatId: string,
  options?: { verbose?: boolean }
) {
  const { verbose } = options ?? {};
  const vectorStore = await NeonVectorStore.fromConnectionString(
    getEmbeddingsModel(),
    {
      tableName: `chat_memory_${chatId.replaceAll("-", "_")}`,
      connectionOptions: {
        readWriteUrl: vectorDBConfig.writeUrl,
        readOnlyUrl: vectorDBConfig.readUrl,
      },
      dimensions: 1536, //! Must match embedding model output size. See ./llm.ts
      hnswIdxM: 8,
      hnswIdxEfConstruction: 32,
      verbose: envConfig.isLocal ? true : verbose,
    }
  );
  return vectorStore;
}

export async function deleteChatMemoryVectorStore(chatId: string) {
  const vectorStore = await getChatMemoryVectorStore(chatId);
  await vectorStore.deleteTableInDatabase();
}
