import * as upstash from '@upstash/pulumi';
import { Index } from '@upstash/vector';

export type CopyIndexInputs = {
  /**
   * The name of the source index.
   */
  sourceIndexName: string;

  /**
   * Number of vectors to copy from the source index to the destination index.
   */
  numVectors: number;
};

export type UpstashVectorInputs = {
  indexName: string;
  region?: 'eu-west-1' | 'us-east-1';
  similarityFunction: 'COSINE' | 'EUCLIDEAN' | 'DOT_PRODUCT';
  dimensionCount: number;
  type?: 'payg' | 'fixed';
  retainOnDelete?: boolean;
  copyIndex?: CopyIndexInputs;
};

export type UpstashVectorOutputs = {
  restUrl: string;
  restToken: string;
  readOnlyRestToken: string;
};

const UpstashVectorProvider = (
  email: string,
  apiKey: string
): $util.dynamic.ResourceProvider<UpstashVectorInputs, UpstashVectorOutputs> => ({
  create: async ({
    indexName: name,
    region = 'us-east-1',
    similarityFunction,
    dimensionCount,
    type = 'payg',
    copyIndex
  }) => {
    const indices = await listIndices({ email, apiKey });
    let index = indices.find((index) => index.name === name);
    if (index) {
      if (
        index.region != region ||
        index.type != type ||
        index.similarity_function != similarityFunction ||
        index.dimension_count != dimensionCount
      ) {
        throw new Error(
          `Index ${name} already exists with different configuration. Please delete the existing index or use a different name.`
        );
      }
      console.warn(`Index ${name} already exists`);
    } else {
      index = await createIndex({
        email,
        apiKey,
        name,
        region,
        similarityFunction,
        dimensionCount,
        type
      });
    }

    if (copyIndex) {
      await cloneIndex({
        email,
        apiKey,
        options: {
          ...copyIndex,
          destIndexName: name
        }
      });
    }

    return {
      id: index.id,
      outs: {
        restUrl: `https://${index.endpoint}`,
        restToken: index.token,
        readOnlyRestToken: index.read_only_token
      }
    };
  },
  update: async (
    id,
    _,
    { indexName: name, region = 'us-east-1', similarityFunction, dimensionCount, type = 'payg' }
  ) => {
    let index = await getIndex({ email, apiKey, indexId: id });
    if (index) {
      if (
        index.region != region ||
        index.type != type ||
        index.similarity_function != similarityFunction ||
        index.dimension_count != dimensionCount
      ) {
        throw new Error(
          `Index ${name} already exists with different configuration. Please delete the existing index or use a different name.`
        );
      }
      console.warn(`Index ${name} already exists`);
    } else {
      index = await createIndex({
        email,
        apiKey,
        name,
        region,
        similarityFunction,
        dimensionCount,
        type
      });
    }

    return {
      outs: {
        restUrl: `https://${index.endpoint}`,
        restToken: index.token,
        readOnlyRestToken: index.read_only_token
      }
    };
  },
  delete: async (id) => {
    const index = await getIndex({ email, apiKey, indexId: id });
    if (index) {
      await deleteIndex({ email, apiKey, indexId: index.id });
    } else {
      console.warn(`Index not found`);
    }
  }
});

export class UpstashVector extends $util.dynamic.Resource {
  public readonly restUrl!: $util.Output<string>;
  public readonly restToken!: $util.Output<string>;
  public readonly readOnlyRestToken!: $util.Output<string>;

  constructor(name: string, args: UpstashVectorInputs, opts?: $util.CustomResourceOptions) {
    super(
      UpstashVectorProvider(
        upstash.config.email ?? process.env.UPSTASH_EMAIL,
        upstash.config.apiKey ?? process.env.UPSTASH_API_KEY
      ),
      name,
      {
        restUrl: undefined,
        restToken: undefined,
        readOnlyRestToken: undefined,
        ...args
      },
      opts
    );
  }
}

//===================================================================================================
// Helper functions
//===================================================================================================
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

async function listIndices({
  email,
  apiKey
}: {
  email: string;
  apiKey: string;
}): Promise<UpstashVectorIndex[]> {
  const response = await fetch('https://api.upstash.com/v2/vector/index/', {
    method: 'GET',
    headers: {
      Authorization: `Basic ${Buffer.from(`${email}:${apiKey}`).toString('base64')}`
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to list indices: ${response.status}\n\t${response.statusText}`);
  }

  return response.json();
}

async function getIndex({
  email,
  apiKey,
  indexId
}: {
  email: string;
  apiKey: string;
  indexId: string;
}): Promise<UpstashVectorIndex> {
  const response = await fetch(`https://api.upstash.com/v2/vector/index/${indexId}`, {
    method: 'GET',
    headers: {
      Authorization: `Basic ${Buffer.from(`${email}:${apiKey}`).toString('base64')}`
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to get index: ${response.status}\n\t${response.statusText}`);
  }

  return response.json();
}

async function createIndex({
  email,
  apiKey,
  name,
  region,
  similarityFunction,
  dimensionCount,
  type
}: {
  email: string;
  apiKey: string;
  name: string;
  region: 'eu-west-1' | 'us-east-1';
  similarityFunction: 'COSINE' | 'EUCLIDEAN' | 'DOT_PRODUCT';
  dimensionCount: number;
  type: 'payg' | 'fixed';
}): Promise<UpstashVectorIndex> {
  const response = await fetch('https://api.upstash.com/v2/vector/index/', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${email}:${apiKey}`).toString('base64')}`,
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

async function deleteIndex({
  email,
  apiKey,
  indexId
}: {
  email: string;
  apiKey: string;
  indexId: string;
}): Promise<void> {
  const response = await fetch(`https://api.upstash.com/v2/vector/index/${indexId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Basic ${Buffer.from(`${email}:${apiKey}`).toString('base64')}`
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to delete index: ${response.status}\n\t${response.statusText}`);
  }
}

async function cloneIndex({
  email,
  apiKey,
  options
}: {
  email: string;
  apiKey: string;
  options: CopyIndexProps;
}): Promise<void> {
  try {
    const list = await listIndices({ email, apiKey });
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
