import weaviate from 'weaviate-ts-client';
import { config } from '../config/weaviate.config';

export function createClient() {
  return weaviate.client({
    scheme: config.scheme,
    host: config.host,
    apiKey: new weaviate.ApiKey(config.apiKey),
  });
}
