export type PurgeCacheInputs = {
  zoneId: $util.Input<string>;
} & (
  | {
      purge_everything: $util.Input<boolean>;
    }
  | {
      hosts: $util.Input<string[]>;
    }
  | {
      files: $util.Input<(string | { url: string; headers: Record<string, string> })[]>;
    }
  | {
      tags: $util.Input<string[]>;
    }
  | {
      prefixes: $util.Input<string[]>;
    }
);

const PurgeCacheResourceProvider = (
  apiKey: string,
): $util.dynamic.ResourceProvider<PurgeCacheInputs> => ({
  create: async ({ zoneId, ...rest }) => {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(rest),
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to purge cache: ${response.statusText}`);
    }

    const { result } = await response.json();
    return {
      id: result.id,
    };
  },
  update: async (_, { zoneId, ...rest }) => {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(rest),
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to purge cache: ${response.statusText}`);
    }

    return {};
  },
});

export class PurgeCache extends $util.dynamic.Resource {
  constructor(name: string, props: PurgeCacheInputs, opts?: $util.CustomResourceOptions) {
    if (!process.env.CLOUDFLARE_API_TOKEN) {
      throw new Error('CLOUDFLARE_API_TOKEN must be set');
    }

    super(PurgeCacheResourceProvider(process.env.CLOUDFLARE_API_TOKEN), name, props, opts);
  }
}
