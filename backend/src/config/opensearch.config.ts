export const config = {
  url: process.env.OPENSEARCH_URL ?? 'http://localhost:9200',
  auth: {
    username: process.env.OPENSEARCH_USERNAME,
    password: process.env.OPENSEARCH_PASSWORD,
  },
};

export default config;
