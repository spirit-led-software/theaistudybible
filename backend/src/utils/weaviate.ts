import { config } from 'src/config/weaviate.config';
import weaviate from 'weaviate-ts-client';

export function createClient() {
  return weaviate.client({
    scheme: config.scheme,
    host: config.host,
    apiKey: new weaviate.ApiKey(config.apiKey),
  });
}
