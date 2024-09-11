import { TURSO_API_BASE_URL } from './constants';
import type { TursoGroup as TursoGroupType, TursoLocationId } from './types';

export type TursoGroupInputs = {
  [k in keyof TursoGroupResourceProviderInputs]: $util.Input<TursoGroupResourceProviderInputs[k]>;
};

type TursoGroupResourceProviderInputs = {
  name: string;
  primaryLocation: TursoLocationId;
  locations: TursoLocationId[];
};

type TursoGroupResourceProviderOutputs = TursoGroupType;

const TursoGroupResourceProvider = (
  api: TursoGroupApi,
): $util.dynamic.ResourceProvider<
  TursoGroupResourceProviderInputs,
  TursoGroupResourceProviderOutputs
> => ({
  create: async ({ name, primaryLocation, locations }) => {
    let { group } = await api.retrieve(name);
    if (!group) {
      const { group: newGroup } = await api.create(name, primaryLocation);
      group = newGroup;
    } else {
      console.log(`Group ${name} already exists`);
    }

    const allLocations = [...locations, primaryLocation];

    const locationsToAdd = allLocations.filter((location) => !group.locations.includes(location));
    for (const location of locationsToAdd) {
      const { group: updatedGroup } = await api.addLocation(name, location);
      group = updatedGroup;
    }

    const locationsToRemove = group.locations.filter(
      (location) => !allLocations.includes(location),
    );
    for (const location of locationsToRemove) {
      const { group: updatedGroup } = await api.removeLocation(name, location);
      group = updatedGroup;
    }

    return {
      id: group.name,
      outs: {
        ...group,
      },
    };
  },
  update: async (id, old, { name, primaryLocation, locations }) => {
    if (old.name !== name) {
      throw new Error('Group name cannot be changed');
    }
    if (old.primary !== primaryLocation) {
      throw new Error('Group primary location cannot be changed');
    }

    let { group } = await api.retrieve(id);
    if (!group) {
      console.log(`Group ${id} did not exist, creating it...`);
      const { group: newGroup } = await api.create(id, primaryLocation);
      group = newGroup;
    }

    const allLocations = [...locations, primaryLocation];

    const locationsToAdd = allLocations.filter((location) => !group.locations.includes(location));
    for (const location of locationsToAdd) {
      const { group: updatedGroup } = await api.addLocation(name, location);
      group = updatedGroup;
    }

    const locationsToRemove = group.locations.filter(
      (location) => !allLocations.includes(location),
    );
    for (const location of locationsToRemove) {
      const { group: updatedGroup } = await api.removeLocation(name, location);
      group = updatedGroup;
    }

    return {
      id: group.name,
      outs: {
        ...group,
      },
    };
  },
  delete: async (id) => {
    return await api.delete(id);
  },
});

export class TursoGroup extends $util.dynamic.Resource {
  declare readonly name: $util.Output<TursoGroupResourceProviderOutputs['name']>;
  declare readonly version: $util.Output<TursoGroupResourceProviderOutputs['version']>;
  declare readonly uuid: $util.Output<TursoGroupResourceProviderOutputs['uuid']>;
  declare readonly primaryLocation: $util.Output<TursoGroupResourceProviderOutputs['primary']>;
  declare readonly locations: $util.Output<TursoGroupResourceProviderOutputs['locations']>;

  constructor(name: string, props: TursoGroupInputs, opts?: $util.CustomResourceOptions) {
    super(
      TursoGroupResourceProvider(new TursoGroupApi()),
      name,
      {
        uuid: undefined,
        ...props,
      },
      opts,
    );
  }
}

// =============================================================================
// API Client
class TursoGroupApi {
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
    return `${TURSO_API_BASE_URL}/v1/organizations/${this.organizationName}/groups`;
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
        group: null,
      };
    }

    if (!response.ok) {
      throw new Error(`HTTPError:\n\tStatus: ${response.status}\n\tBody: ${await response.text()}`);
    }

    return await response.json();
  }

  async list() {
    const data = await this.fetch();
    return data as {
      groups: TursoGroupType[];
    };
  }

  async retrieve(name: string) {
    const data = await this.fetch({ path: `/${name}` });
    return data as {
      group: TursoGroupType;
    };
  }

  async create(name: string, location: TursoLocationId) {
    const data = await this.fetch({
      options: {
        method: 'POST',
        body: JSON.stringify({ name, location }),
      },
    });
    return data as {
      group: TursoGroupType;
    };
  }

  async delete(name: string) {
    await this.fetch({
      path: `/${name}`,
      options: {
        method: 'DELETE',
      },
    });
  }

  async addLocation(name: string, location: TursoLocationId) {
    const data = await this.fetch({
      path: `/${name}/locations/${location}`,
      options: {
        method: 'POST',
      },
    });
    return data as {
      group: TursoGroupType;
    };
  }

  async removeLocation(name: string, location: TursoLocationId) {
    const data = await this.fetch({
      path: `/${name}/locations/${location}`,
      options: {
        method: 'DELETE',
      },
    });
    return data as {
      group: TursoGroupType;
    };
  }
}
