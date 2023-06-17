export type UnstructuredConfig = {
  apiUrl: string;
};

export const config: UnstructuredConfig = {
  apiUrl: process.env.UNSTRUCTURED_API_URL,
};

export default config;
