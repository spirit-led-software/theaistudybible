import { vectorDBConfig } from "@core/configs";
import { TokenTextSplitter } from "langchain/text_splitter";

export const textSplitter = new TokenTextSplitter({
  chunkSize: vectorDBConfig.docEmbeddingContentLength,
  chunkOverlap: vectorDBConfig.docEmbeddingContentOverlap,
  encodingName: "cl100k_base",
});
