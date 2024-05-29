import * as pulumi from "@pulumi/pulumi";
import * as upstash from "@upstash/pulumi";
import { UpstashClient } from "../lib/upstash-client";

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
  region?: "eu-west-1" | "us-east-1";
  similarityFunction: "COSINE" | "EUCLIDEAN" | "DOT_PRODUCT";
  dimensionCount: number;
  type?: "payg" | "fixed";
  retainOnDelete?: boolean;
  copyIndex?: CopyIndexInputs;
};

export type UpstashVectorOutputs = {
  restUrl: string;
  restToken: string;
  readOnlyRestToken: string;
};

const UpstashVectorProvider = (
  client: UpstashClient
): pulumi.dynamic.ResourceProvider<
  UpstashVectorInputs,
  UpstashVectorOutputs
> => ({
  create: async ({
    indexName: name,
    region = "us-east-1",
    similarityFunction,
    dimensionCount,
    type = "payg",
    copyIndex,
  }) => {
    const indices = await client.listIndices();
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
      index = await client.createIndex({
        name,
        region,
        similarityFunction,
        dimensionCount,
        type,
      });
    }

    if (copyIndex) {
      await client.cloneIndex({
        ...copyIndex,
        destIndexName: name,
      });
    }

    return {
      id: index.id,
      outs: {
        restUrl: `https://${index.endpoint}`,
        restToken: index.token,
        readOnlyRestToken: index.read_only_token,
      },
    };
  },
  update: async (
    id,
    _,
    {
      indexName: name,
      region = "us-east-1",
      similarityFunction,
      dimensionCount,
      type = "payg",
    }
  ) => {
    let index = await client.getIndex(id);
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
      index = await client.createIndex({
        name,
        region,
        similarityFunction,
        dimensionCount,
        type,
      });
    }

    return {
      outs: {
        restUrl: `https://${index.endpoint}`,
        restToken: index.token,
        readOnlyRestToken: index.read_only_token,
      },
    };
  },
  delete: async (id) => {
    const index = await client.getIndex(id);
    if (index) {
      await client.deleteIndex(id);
    } else {
      console.warn(`Index not found`);
    }
  },
});

export class UpstashVector extends pulumi.dynamic.Resource {
  public declare readonly restUrl: pulumi.Output<string>;
  public declare readonly restToken: pulumi.Output<string>;
  public declare readonly readOnlyRestToken: pulumi.Output<string>;

  constructor(
    name: string,
    args: UpstashVectorInputs,
    opts?: pulumi.CustomResourceOptions
  ) {
    const email = upstash.config.email ?? process.env.UPSTASH_EMAIL;
    if (!email) {
      throw new Error("UPSTASH_EMAIL is not set");
    }
    const apiKey = upstash.config.apiKey ?? process.env.UPSTASH_API_KEY;
    if (!apiKey) {
      throw new Error("UPSTASH_API_KEY is not set");
    }

    super(
      UpstashVectorProvider(new UpstashClient(email, apiKey)),
      name,
      {
        ...args,
        restUrl: undefined,
        restToken: undefined,
        readOnlyRestToken: undefined,
      },
      opts,
      "theaistudybible",
      "UpstashVector"
    );
  }
}
