interface UnstructuredConfig {
  apiKey: string;
}

export const config: UnstructuredConfig = {
  apiKey: process.env.UNSTRUCTURED_API_KEY!,
};

export default config;
