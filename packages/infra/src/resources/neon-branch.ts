import {
  type BranchCreateRequestEndpointOptions,
  type Database,
  type Endpoint,
  type EndpointType,
  type Provisioner,
  type Role
} from '@neondatabase/api-client';
import { NeonClient } from '../lib/neon-client';

export type NeonBranchInputs = {
  projectName: string;
  branchName: string;
  roleName: string;
  endpointOptions?: BranchCreateRequestEndpointOptions[];
  retainOnDelete?: boolean;
};

export type NeonBranchOutputs = {
  readOnlyUrl: string;
  readWriteUrl: string;
};

type NeonConnectionUrl = {
  type: EndpointType;
  url: string;
};

export class NeonBranchProvider implements $util.dynamic.ResourceProvider {
  private readonly neonClient: NeonClient;

  constructor(apiKey: string) {
    this.neonClient = new NeonClient(apiKey);
  }

  private async getProjectByName(projectName: string) {
    const listProjectsResponse = await this.neonClient.listProjects({});
    return listProjectsResponse.projects.find((project) => project.name === projectName);
  }

  private async getBranch(projectId: string, branchId: string) {
    const branchResponse = await this.neonClient.getProjectBranch(projectId, branchId);
    return branchResponse.branch;
  }

  private async getBranchByName(projectId: string, branchName: string) {
    const branches = await this.neonClient.listProjectBranches(projectId);
    return branches.branches.find((branch) => branch.name === branchName);
  }

  private async createBranch(
    projectId: string,
    branchName: string,
    endpointOptions: BranchCreateRequestEndpointOptions[]
  ) {
    const createBranchResponse = await this.neonClient.createProjectBranch(projectId, {
      branch: {
        name: branchName
      },
      endpoints: endpointOptions
    });
    return createBranchResponse.branch;
  }

  private async updateBranch(
    projectId: string,
    branchId: string,
    endpointOptions: BranchCreateRequestEndpointOptions[]
  ) {
    const endpointsResponse = await this.neonClient.listProjectBranchEndpoints(projectId, branchId);
    const existingEndpoints = endpointsResponse.endpoints;

    for (const existingEndpoint of existingEndpoints) {
      if (existingEndpoint.type === 'read_write') {
        const readWriteOptionIndex = endpointOptions.findIndex(
          (option) => option.type === 'read_write'
        );
        const readWriteOption = endpointOptions[readWriteOptionIndex];
        if (readWriteOption) {
          endpointOptions = endpointOptions.filter((_, index) => index !== readWriteOptionIndex);
          await this.neonClient.updateProjectEndpoint(projectId, existingEndpoint.id, {
            endpoint: {
              provisioner: readWriteOption.provisioner || ('k8s-neonvm' as Provisioner),
              autoscaling_limit_min_cu: readWriteOption.autoscaling_limit_min_cu || 0.25,
              autoscaling_limit_max_cu: readWriteOption.autoscaling_limit_max_cu || 1,
              suspend_timeout_seconds: readWriteOption.suspend_timeout_seconds || 0
            }
          });
        }
      } else if (existingEndpoint.type === 'read_only') {
        const readOnlyOptionIndex = endpointOptions.findIndex(
          (option) => option.type === 'read_only'
        );
        const readOnlyOption = endpointOptions[readOnlyOptionIndex];
        if (readOnlyOption) {
          endpointOptions = endpointOptions.filter((_, index) => index !== readOnlyOptionIndex);
          await this.neonClient.updateProjectEndpoint(projectId, existingEndpoint.id, {
            endpoint: {
              provisioner: readOnlyOption.provisioner || ('k8s-neonvm' as Provisioner),
              autoscaling_limit_min_cu: readOnlyOption.autoscaling_limit_min_cu || 0.25,
              autoscaling_limit_max_cu: readOnlyOption.autoscaling_limit_max_cu || 1,
              suspend_timeout_seconds: readOnlyOption.suspend_timeout_seconds || 0
            }
          });
        } else {
          await this.neonClient.deleteProjectEndpoint(projectId, existingEndpoint.id);
        }
      } else {
        throw new Error(`Unknown endpoint type ${existingEndpoint.type}`);
      }
    }

    // Create any new endpoints
    for (const endpointOption of endpointOptions) {
      await this.neonClient.createProjectEndpoint(projectId, {
        endpoint: {
          branch_id: branchId,
          type: endpointOption.type,
          provisioner: endpointOption.provisioner || ('k8s-neonvm' as Provisioner),
          autoscaling_limit_min_cu: endpointOption.autoscaling_limit_min_cu || 0.25,
          autoscaling_limit_max_cu: endpointOption.autoscaling_limit_max_cu || 1,
          suspend_timeout_seconds: endpointOption.suspend_timeout_seconds || 0
        }
      });
    }

    return await this.getBranch(projectId, branchId);
  }

  private async deleteBranch(projectId: string, branchId: string) {
    const branch = await this.getBranch(projectId, branchId);
    const endpointsResponse = await this.neonClient.listProjectBranchEndpoints(
      projectId,
      branch.id
    );
    const endpoints = endpointsResponse.endpoints;
    for (const endpoint of endpoints) {
      await this.neonClient.deleteProjectEndpoint(projectId, endpoint.id);
    }

    await this.neonClient.deleteProjectBranch(projectId, branch.id);
  }

  private async getAllNeonConnectionUrls(
    projectId: string,
    branchId: string,
    roleName: string
  ): Promise<NeonConnectionUrl[]> {
    const endpointsResponse = await this.neonClient.listProjectBranchEndpoints(projectId, branchId);
    const endpoints = endpointsResponse.endpoints;

    const rolesResponse = await this.neonClient.listProjectBranchRoles(projectId, branchId);
    const role = rolesResponse.roles.find((role) => role.name === roleName);
    if (!role) {
      throw new Error(
        `DB Role '${roleName}' not found. All roles: ${JSON.stringify(rolesResponse)}`
      );
    }

    let rolePassword = role.password;
    if (!rolePassword) {
      const rolePasswordResponse = await this.neonClient.getProjectBranchRolePassword(
        projectId,
        branchId,
        role.name
      );
      rolePassword = rolePasswordResponse.password;
      if (!rolePassword) {
        throw new Error(
          `DB Role '${role.name}' password could not be obtained: ${JSON.stringify(
            rolePasswordResponse
          )}`
        );
      }
      role.password = rolePassword;
    }

    const databasesResponse = await this.neonClient.listProjectBranchDatabases(projectId, branchId);
    return this.formConnectionUrls(databasesResponse.databases, endpoints, role);
  }

  private formConnectionUrls(databases: Database[], endpoints: Endpoint[], role: Role) {
    console.log(
      `Forming connection urls for databases: ${JSON.stringify(
        databases
      )}, endpoints: ${JSON.stringify(endpoints)}, role: ${JSON.stringify(role)}`
    );
    const connectionUrls: NeonConnectionUrl[] = [];
    for (const database of databases) {
      for (const endpoint of endpoints) {
        // Below is implementation for pgbouncer.
        const hostPieces = endpoint.host.split('.');
        const host = `${hostPieces[0]}-pooler.${hostPieces.slice(1).join('.')}`;

        connectionUrls.push({
          type: endpoint.type,
          url: `postgres://${role.name}:${role.password}@${host}/${database.name}?sslmode=require`
        });
      }
    }
    return connectionUrls;
  }

  private getDatabasesFromConnectionUrls(connectionUrls: NeonConnectionUrl[]) {
    const readWriteUrl = connectionUrls.find((url) => url.type === 'read_write')?.url;
    if (!readWriteUrl) {
      throw new Error('No readwrite database found');
    }
    const readOnlyUrl = connectionUrls.find((url) => url.type === 'read_only')?.url || readWriteUrl;

    return {
      readOnlyUrl,
      readWriteUrl
    };
  }

  async create({ projectName, branchName, roleName, endpointOptions = [] }: NeonBranchInputs) {
    const project = await this.getProjectByName(projectName);
    if (!project) {
      throw new Error(`Project '${projectName}' not found`);
    }

    let branch = await this.getBranchByName(project.id, branchName);
    if (!branch) {
      branch = await this.createBranch(project.id, branchName, endpointOptions);
    } else {
      branch = await this.updateBranch(project.id, branch.id, endpointOptions);
    }
    const connectionUrls = await this.getAllNeonConnectionUrls(project.id, branch.id, roleName);
    const urls = this.getDatabasesFromConnectionUrls(connectionUrls);
    return {
      id: `${project.id}-${branch.id}`,
      outs: {
        readOnlyUrl: urls.readOnlyUrl,
        readWriteUrl: urls.readWriteUrl
      }
    };
  }

  async update(
    id: string,
    _: NeonBranchInputs,
    { roleName, branchName, endpointOptions = [] }: NeonBranchInputs
  ) {
    const [projectId, branchId] = id.split('-');
    let branch = await this.getBranch(projectId, branchId);
    if (!branch) {
      branch = await this.createBranch(projectId, branchName, endpointOptions);
    } else {
      branch = await this.updateBranch(projectId, branch.id, endpointOptions);
    }
    const connectionUrls = await this.getAllNeonConnectionUrls(projectId, branch.id, roleName);
    const urls = this.getDatabasesFromConnectionUrls(connectionUrls);
    return {
      outs: {
        readOnlyUrl: urls.readOnlyUrl,
        readWriteUrl: urls.readWriteUrl
      }
    };
  }

  async delete(id: string) {
    const [projectId, branchId] = id.split('-');
    await this.deleteBranch(projectId, branchId);
  }
}

export class NeonBranch extends $util.dynamic.Resource {
  public readonly readOnlyUrl!: $util.Output<string>;
  public readonly readWriteUrl!: $util.Output<string>;

  constructor(name: string, args: NeonBranchInputs, opts?: $util.CustomResourceOptions) {
    super(
      new NeonBranchProvider(process.env.NEON_API_KEY!),
      name,
      { readOnlyUrl: undefined, readWriteUrl: undefined, ...args },
      opts
    );
  }
}
