import "@tensorflow/tfjs-node";
import * as dotenv from "dotenv";
import { OpenAI } from "langchain";
import { VectorDBQAChain } from "langchain/chains";
import { TensorFlowEmbeddings } from "langchain/embeddings/tensorflow";
import { WeaviateStore } from "langchain/vectorstores/weaviate";
import weaviate from "weaviate-ts-client";
import { scrapeSite } from "./scraper";

const main = async () => {
  dotenv.config({
    path: ".env",
  });
  console.debug(process.env);

  await scrapeSite("https://enduringword.com", "/bible-commentary/.*");

  const embeddings = new TensorFlowEmbeddings();

  const client = weaviate.client({
    scheme: process.env.WEAVIATE_SCHEME,
    host: process.env.WEAVIATE_HOST,
    apiKey: new weaviate.ApiKey(process.env.WEAVIATE_API_KEY),
  });

  const store = await WeaviateStore.fromExistingIndex(embeddings, {
    client,
    indexName: "Docs",
    textKey: "text",
  });

  await store.similaritySearch("David", 10).then((res) => {
    console.debug(res);
  });

  const model = new OpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    temperature: 0.7,
  });

  const chain = VectorDBQAChain.fromLLM(model, store, {
    returnSourceDocuments: true,
  });

  const result = await chain.call({
    query: "Summarize the conversation David had with the young man.",
  });

  console.debug(result);
};
main();
