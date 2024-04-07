import { CONCURRENT_UPSERT_LIMIT } from '@revelationsai/core/langchain/vectorstores/upstash';
import { Index } from '@upstash/vector';
import type { CdkCustomResourceHandler, CdkCustomResourceResponse } from 'aws-lambda';

export type CopyIndexProps = {
  /**
   * The name of the source index.
   */
  sourceIndexName: string;

  /**
   * Number of vectors to copy from the source index to the destination index.
   */
  numVectors: number;
};

export const handler: CdkCustomResourceHandler = async (event) => {
  console.log('Received event from custom resource:', JSON.stringify(event));

  const response: CdkCustomResourceResponse = {
    StackId: event.StackId,
    RequestId: event.RequestId,
    LogicalResourceId: event.LogicalResourceId
  };
  try {
    const email = event.ResourceProperties.email as string;
    const apiKey = event.ResourceProperties.apiKey as string;
    const name = event.ResourceProperties.name as string;
    const region = event.ResourceProperties.region as 'eu-west-1' | 'us-east-1';
    const similarityFunction = event.ResourceProperties.similarityFunction as
      | 'COSINE'
      | 'EUCLIDEAN'
      | 'DOT_PRODUCT';
    const dimensionCount = parseInt(event.ResourceProperties.dimensionCount);
    const type = event.ResourceProperties.type as 'payg' | 'fixed';
    const retainOnDelete = event.ResourceProperties.retainOnDelete === 'true';
    const copyIndex = event.ResourceProperties.copyIndex
      ? (JSON.parse(event.ResourceProperties.copyIndex) as CopyIndexProps)
      : undefined;

    console.log(
      `Upstash Vector inputs: apiKey: ${apiKey}, name: ${name}, retainOnDelete: ${retainOnDelete} similarityFunction: ${similarityFunction}, dimensionCount: ${dimensionCount}, type: ${type} region: ${region} copyIndex: ${copyIndex}`
    );

    switch (event.RequestType) {
      case 'Delete': {
        if (!retainOnDelete) {
          const indices = await listIndices({ email, apiKey });
          const index = indices.find((index) => index.name === name);
          if (index) {
            await deleteIndex({ email, apiKey, indexId: index.id });
          } else {
            console.warn(`Index ${name} not found`);
          }
        }
        response.Status = 'SUCCESS';
        break;
      }
      default: {
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
            type,
            copyIndex
          });
        }

        response.Status = 'SUCCESS';
        response.Data = {
          restUrl: `https://${index.endpoint}`,
          restToken: index.token,
          readOnlyRestToken: index.read_only_token
        };
        break;
      }
    }
    console.log('Response from custom resource:', response);
    return response;
  } catch (error) {
    console.error(error);
    response.Status = 'FAILED';
    if (error instanceof Error) {
      response.Reason = error.message;
      response.Data = {
        stack: error.stack
      };
    } else {
      response.Reason = `Error: ${JSON.stringify(error)}`;
    }
    response.Data = {
      ...response.Data,
      restUrl: null,
      restToken: null,
      readOnlyRestToken: null
    };
    return response;
  }
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

export async function listIndices({
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

export async function getIndex({
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

export async function createIndex({
  email,
  apiKey,
  name,
  region,
  similarityFunction,
  dimensionCount,
  type,
  copyIndex
}: {
  email: string;
  apiKey: string;
  name: string;
  region: 'eu-west-1' | 'us-east-1';
  similarityFunction: 'COSINE' | 'EUCLIDEAN' | 'DOT_PRODUCT';
  dimensionCount: number;
  type: 'payg' | 'fixed';
  copyIndex?: CopyIndexProps;
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

  const createdVector = await response.json();

  if (copyIndex) {
    try {
      const source = await listIndices({ email, apiKey }).then((indices) =>
        indices.find((index) => index.name === copyIndex.sourceIndexName)
      );
      if (!source) {
        throw new Error(`Source index ${copyIndex.sourceIndexName} not found`);
      }

      const sourceIndex = new Index({
        url: source.endpoint,
        token: source.token
      });
      const destIndex = new Index({
        url: createdVector.endpoint,
        token: createdVector.token
      });

      let i = 0;
      while (i < copyIndex.numVectors) {
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

  return createdVector;
}

export async function deleteIndex({
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
