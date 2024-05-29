import { Index } from '@upstash/vector';

const CONCURRENT_UPSERT_LIMIT = 1000;

type CopyIndexProps = {
  /**
   * The name of the source index.
   */
  sourceIndexName: string;

  /**
   * The name of the destination index.
   */
  destIndexName: string;

  /**
   * Number of vectors to copy from the source index to the destination index.
   */
  numVectors: number;
};

interface UpstashVectorIndex {
  customer_id: string;
  id: string;
  name: string;
  similarity_function: 'COSINE' | 'EUCLIDEAN' | 'DOT_PRODUCT';
  dimension_count: number;
  endpoint: string;
  token: string;
  read_only_token: string;
  type: 'payg' | 'fixed';
  region: 'eu-west-1' | 'us-east-1';
  max_vector_count: number;
  max_daily_updates: number;
  max_daily_queries: number;
  max_monthly_bandwidth: number;
  max_writes_per_second: number;
  max_query_per_second: number;
  max_reads_per_request: number;
  max_writes_per_request: number;
  max_total_metadata_size: number;
  creation_time: number;
}

export class UpstashClient {
  private readonly email: string;
  private readonly apiKey: string;

  constructor(email: string, apiKey: string) {
    this.email = email;
    this.apiKey = apiKey;
  }

  private getAuthKey() {
    return Buffer.from(`${this.email}:${this.apiKey}`).toString('base64');
  }

  async listIndices(): Promise<UpstashVectorIndex[]> {
    const response = await fetch('https://api.upstash.com/v2/vector/index/', {
      method: 'GET',
      headers: {
        Authorization: `Basic ${this.getAuthKey()}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to list indices: ${response.status}\n\t${response.statusText}`);
    }

    return response.json();
  }

  async getIndex(indexId: string): Promise<UpstashVectorIndex> {
    const response = await fetch(`https://api.upstash.com/v2/vector/index/${indexId}`, {
      method: 'GET',
      headers: {
        Authorization: `Basic ${this.getAuthKey()}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get index: ${response.status}\n\t${response.statusText}`);
    }

    return response.json();
  }

  async createIndex({
    name,
    region,
    similarityFunction,
    dimensionCount,
    type
  }: {
    name: string;
    region: 'eu-west-1' | 'us-east-1';
    similarityFunction: 'COSINE' | 'EUCLIDEAN' | 'DOT_PRODUCT';
    dimensionCount: number;
    type: 'payg' | 'fixed';
  }): Promise<UpstashVectorIndex> {
    const response = await fetch('https://api.upstash.com/v2/vector/index/', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${this.getAuthKey()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name,
        region,
        similarity_function: similarityFunction,
        dimension_count: dimensionCount,
        type
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to create index: ${response.status}\n\t${response.statusText}`);
    }

    return await response.json();
  }

  async deleteIndex(indexId: string): Promise<void> {
    const response = await fetch(`https://api.upstash.com/v2/vector/index/${indexId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Basic ${this.getAuthKey()}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to delete index: ${response.status}\n\t${response.statusText}`);
    }
  }

  async cloneIndex(options: CopyIndexProps): Promise<void> {
    try {
      const list = await this.listIndices();
      const source = list.find((index) => index.name === options.sourceIndexName);
      if (!source) {
        throw new Error(`Source index ${options.sourceIndexName} not found`);
      }

      const dest = list.find((index) => index.name === options.destIndexName);
      if (!dest) {
        throw new Error(`Destination index ${options.destIndexName} not found`);
      }

      const sourceIndex = new Index({
        url: source.endpoint,
        token: source.token
      });
      const destIndex = new Index({
        url: dest.endpoint,
        token: dest.token
      });

      let i = 0;
      while (i < options.numVectors) {
        const { vectors, nextCursor } = await sourceIndex.range({
          cursor: i,
          limit: CONCURRENT_UPSERT_LIMIT,
          includeMetadata: true,
          includeVectors: true
        });
        await destIndex.upsert(vectors);
        if (!nextCursor) {
          break;
        }
        i = parseInt(nextCursor);
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error copying vectors: ${error.message}\n\t${error.stack}`);
      } else {
        console.error(`Error copying vectors: ${JSON.stringify(error)}`);
      }
    }
  }
}
