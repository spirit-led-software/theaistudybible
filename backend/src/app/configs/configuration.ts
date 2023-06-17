import {
  axiosConfig,
  databaseConfig,
  llmConfig,
  redisConfig,
  s3Config,
  unstructuredConfig,
  vectorDbConfig,
  webScraperConfig,
} from '@configs';

export default () => ({
  axios: axiosConfig,
  database: databaseConfig,
  llm: llmConfig,
  redis: redisConfig,
  s3: s3Config,
  unstructured: unstructuredConfig,
  vectorDb: vectorDbConfig,
  webScraper: webScraperConfig,
});
