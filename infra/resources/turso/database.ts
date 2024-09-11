import { TURSO_API_BASE_URL } from './constants';
import type {
  TursoDatabaseConfiguration,
  TursoDatabaseSeedOptions,
  TursoDatabase as TursoDatabaseType,
} from './types';

export type TursoDatabaseInputs = {
  [k in keyof TursoDatabaseResourceProviderInputs]: $util.Input<
    TursoDatabaseResourceProviderInputs[k]
  >;
};

type TursoDatabaseResourceProviderInputs = {
  name: string;
  group: string;
  seed?: TursoDatabaseSeedOptions;
  size_limit?: `${number}`;
  is_schema?: boolean;
  schema?: string;
  allow_attach?: boolean;
  block_reads?: boolean;
  block_writes?: boolean;
};

type TursoDatabaseResourceProviderOutputs = TursoDatabaseType & {
  token: string;
};

const TursoDatabaseResourceProvider = (
  api: TursoDatabaseApi,
): $util.dynamic.ResourceProvider<
  TursoDatabaseResourceProviderInputs,
  TursoDatabaseResourceProviderOutputs
> => ({
  create: async ({
    name,
    group,
    seed,
    size_limit,
    is_schema,
    schema,
    allow_attach,
    block_reads,
    block_writes,
  }) => {
    let { database } = await api.retrieve(name);
    if (!database) {
      const { database: newDatabase } = await api.create({
        name,
        group,
        seed,
        size_limit,
        is_schema,
        schema,
      });
      database = newDatabase;
    } else {
      console.log(`Database ${name} already exists`);
    }

    await api.updateConfiguration(name, {
      allow_attach,
      block_reads,
      block_writes,
      size_limit,
    });

    const { database: updatedDatabase } = await api.retrieve(name);
    database = updatedDatabase;

    const { jwt: token } = await api.createToken(name);

    return {
      id: database.Name,
      outs: {
        ...database,
        token,
      },
    };
  },
  update: async (
    id,
    old,
    { name, group, seed, size_limit, is_schema, schema, allow_attach, block_reads, block_writes },
  ) => {
    if (old.Name !== name) {
      throw new Error('Database name cannot be changed');
    }
    if (old.group !== group) {
      throw new Error('Database group cannot be changed');
    }

    let { database } = await api.retrieve(id);
    if (!database) {
      console.log(`Database ${id} did not exist, creating it...`);
      const { database: newDatabase } = await api.create({
        name,
        group,
        seed,
        size_limit,
        is_schema,
        schema,
      });
      database = newDatabase;
    }

    await api.updateConfiguration(id, {
      allow_attach,
      block_reads,
      block_writes,
      size_limit,
    });

    const { database: updatedDatabase } = await api.retrieve(id);
    database = updatedDatabase;

    return {
      id: database.Name,
      outs: {
        ...database,
        token: old.token,
      },
    };
  },
  delete: async (id) => {
    return await api.delete(id);
  },
});

export class TursoDatabase extends $util.dynamic.Resource {
  declare readonly name: $util.Output<TursoDatabaseResourceProviderOutputs['Name']>;
  declare readonly dbId: $util.Output<TursoDatabaseResourceProviderOutputs['DbId']>;
  declare readonly hostname: $util.Output<TursoDatabaseResourceProviderOutputs['Hostname']>;
  declare readonly token: $util.Output<TursoDatabaseResourceProviderOutputs['token']>;
  declare readonly regions: $util.Output<TursoDatabaseResourceProviderOutputs['regions']>;
  declare readonly primaryRegion: $util.Output<
    TursoDatabaseResourceProviderOutputs['primaryRegion']
  >;

  constructor(name: string, props: TursoDatabaseInputs, opts?: $util.CustomResourceOptions) {
    super(
      TursoDatabaseResourceProvider(new TursoDatabaseApi()),
      name,
      {
        dbId: undefined,
        hostname: undefined,
        token: undefined,
        regions: undefined,
        primaryRegion: undefined,
        ...props,
      },
      opts,
    );
  }
}

// ===============================================================================
// API Client
class TursoDatabaseApi {
  private readonly apiKey: string;
  private readonly organizationName: string;

  constructor() {
    if (!process.env.TURSO_ORG_NAME || !process.env.TURSO_API_KEY) {
      throw new Error('TURSO_ORG_NAME and TURSO_API_KEY must be set');
    }
    this.apiKey = process.env.TURSO_API_KEY;
    this.organizationName = process.env.TURSO_ORG_NAME;
  }

  private getBaseUrl() {
    return `${TURSO_API_BASE_URL}/v1/organizations/${this.organizationName}/databases`;
  }

  private async fetch({ path = '', options = {} }: { path?: string; options?: RequestInit } = {}) {
    const response = await fetch(`${this.getBaseUrl()}${path}`, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 404) {
      return {
        database: null,
      };
    }

    if (!response.ok) {
      throw new Error(`HTTPError:\n\tStatus: ${response.status}\n\tBody: ${await response.text()}`);
    }

    return await response.json();
  }

  async list({ group, schema }: { group?: string; schema?: string } = {}) {
    const queryParams = new URLSearchParams();
    if (group) {
      queryParams.append('group', group);
    }
    if (schema) {
      queryParams.append('schema', schema);
    }

    const data = await this.fetch({
      path: `?${queryParams.toString()}`,
    });
    return data as {
      databases: TursoDatabaseType[];
    };
  }

  async create(options: {
    name: string;
    group: string;
    seed?: TursoDatabaseSeedOptions;
    size_limit?: string;
    is_schema?: boolean;
    schema?: string;
  }) {
    const data = await this.fetch({
      options: {
        method: 'POST',
        body: JSON.stringify(options),
      },
    });
    return data as {
      database: TursoDatabaseType;
    };
  }

  async retrieve(name: string) {
    const data = await this.fetch({ path: `/${name}` });
    return data as {
      database: TursoDatabaseType;
    };
  }

  async retrieveConfiguration(name: string) {
    const data = await this.fetch({ path: `/${name}/configuration` });
    return data as TursoDatabaseConfiguration;
  }

  async updateConfiguration(name: string, options: Partial<TursoDatabaseConfiguration>) {
    const data = await this.fetch({
      path: `/${name}/configuration`,
      options: {
        method: 'PATCH',
        body: JSON.stringify(options),
      },
    });
    return data as TursoDatabaseConfiguration;
  }

  async delete(name: string) {
    await this.fetch({
      path: `/${name}`,
      options: {
        method: 'DELETE',
      },
    });
  }

  async createToken(
    name: string,
    options?: {
      expiration: string;
      authorization: 'full-access' | 'read-only';
    },
  ) {
    const queryParams = new URLSearchParams();
    if (options) {
      if (options.expiration) {
        queryParams.append('expiration', options.expiration);
      }
      if (options.authorization) {
        queryParams.append('authorization', options.authorization);
      }
    }
    const data = await this.fetch({
      path: `/${name}/auth/tokens?${queryParams.toString()}`,
      options: {
        method: 'POST',
      },
    });
    return data as {
      jwt: string;
    };
  }
}
