import { envConfig, vectorDBConfig } from "@core/configs";
import { NeonVectorStore } from "@core/langchain/vectorstores/neon";
import { getEmbeddingsModel } from "./llm";

export async function getDocumentVectorStore(options?: {
  verbose?: boolean;
  filters?: any[];
}) {
  const { verbose, filters } = options ?? {};
  const vectorStore = await NeonVectorStore.fromConnectionString(
    getEmbeddingsModel(),
    {
      tableName: `documents_${getEmbeddingsModel().model.replaceAll(
        /[^a-zA-Z0-9]/g,
        "_"
      )}`,
      connectionOptions: {
        readWriteUrl: vectorDBConfig.writeUrl,
        readOnlyUrl: vectorDBConfig.readUrl,
      },
      dimensions: 1024, //! Must match embedding model output size. See ./llm.ts
      distance: "cosine",
      hnswIdxM: 16,
      hnswIdxEfConstruction: 64,
      verbose: envConfig.isLocal ? true : verbose,
      filters,
    }
  );
  return vectorStore;
}
