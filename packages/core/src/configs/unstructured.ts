import { UnstructuredConfig } from "unstructured";

export const config: UnstructuredConfig = {
  apiKey: process.env.UNSTRUCTURED_API_KEY as string,
};

export default config;
