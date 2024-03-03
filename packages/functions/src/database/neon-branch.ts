import type { CdkCustomResourceHandler, CdkCustomResourceResponse } from 'aws-lambda';
import {
  NeonClient,
  type BranchCreateRequestEndpointOptions,
  type BranchResponse,
  type BranchesResponse,
  type Database,
  type DatabasesResponse,
  type Endpoint,
  type EndpointType,
  type EndpointsResponse,
  type ProjectsResponse,
  type Role,
  type RolePasswordResponse,
  type RolesResponse
} from 'neon-sdk';

const Neon = (apiKey: string) =>
  new NeonClient({
    TOKEN: apiKey
  });

export enum DatabaseType {
  READWRITE,
  READONLY,
  VECTOR_READWRITE,
  VECTOR_READONLY
}

export type NeonConnectionUrl = {
  type: DatabaseType;
  url: string;
};

export const handler: CdkCustomResourceHandler = async (event) => {
  console.log('Received event from custom resource:', JSON.stringify(event));

  const response: CdkCustomResourceResponse = {
    StackId: event.StackId,
    RequestId: event.RequestId,
    LogicalResourceId: event.LogicalResourceId
  };
  try {
    const projectName = event.ResourceProperties.projectName as string;
    const branchName = event.ResourceProperties.branchName as string;
    const roleName = event.ResourceProperties.roleName as string;
    const apiKey = event.ResourceProperties.apiKey as string;
    const endpointOptions = JSON.parse(
      event.ResourceProperties.endpointOptions
    ) as BranchCreateRequestEndpointOptions[];
    const retainOnDelete = event.ResourceProperties.retainOnDelete === 'true';

    console.log(
      `Neon branch inputs: projectName=${projectName}, branchName=${branchName}, roleName=${roleName}, endpointOptions=${JSON.stringify(
        endpointOptions
      )}`
    );

    const project = await getProjectByName(apiKey, projectName);
    if (!project) {
      response.Status = 'FAILED';
      response.Reason = `Project ${projectName} not found`;
      return response;
    }

    switch (event.RequestType) {
      case 'Delete': {
        if (!retainOnDelete) {
          const branch = await getBranchByName(apiKey, project.id, branchName);
          if (!branch) {
            response.Status = 'FAILED';
            response.Reason = `Branch ${branchName} not found`;
            break;
          }
          await deleteBranch(apiKey, project.id, branch.id);
        }
        response.Status = 'SUCCESS';
        break;
      }
      default: {
        let branch = await getBranchByName(apiKey, project.id, branchName);
        if (!branch) {
          branch = await createBranch(apiKey, project.id, branchName, endpointOptions);
        } else {
          branch = await updateBranch(apiKey, project.id, branch.id, endpointOptions);
        }
        const connectionUrls = await getAllNeonConnectionUrls(
          apiKey,
          project.id,
          branch.id,
          roleName
        );
        const urls = getDatabasesFromConnectionUrls(connectionUrls);

        response.Status = 'SUCCESS';
        response.Data = {
          projectId: project.id,
          ...urls
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
    return response;
  }
};

export async function getProjectByName(apiKey: string, projectName: string) {
  const neonClient = Neon(apiKey);
  const listProjectsResponse = (await neonClient.project.listProjects()) as ProjectsResponse;
  const project = listProjectsResponse.projects.find((project) => project.name === projectName);
  return project;
}

export async function getBranch(apiKey: string, projectId: string, branchId: string) {
  const neonClient = Neon(apiKey);
  const branchResponse = (await neonClient.branch.getProjectBranch(
    projectId,
    branchId
  )) as BranchResponse;
  return branchResponse.branch;
}

export async function getBranchByName(apiKey: string, projectId: string, branchName: string) {
  const neonClient = Neon(apiKey);
  const branches = (await neonClient.branch.listProjectBranches(projectId)) as BranchesResponse;
  const branch = branches.branches.find((branch) => branch.name === branchName);
  return branch;
}

export async function createBranch(
  apiKey: string,
  projectId: string,
  branchName: string,
  endpointOptions: BranchCreateRequestEndpointOptions[]
) {
  const neonClient = Neon(apiKey);
  const createBranchResponse = (await neonClient.branch.createProjectBranch(projectId, {
    branch: {
      name: branchName
    },
    endpoints: endpointOptions
  })) as BranchResponse;
  return createBranchResponse.branch;
}

export async function updateBranch(
  apiKey: string,
  projectId: string,
  branchId: string,
  endpointOptions: BranchCreateRequestEndpointOptions[]
) {
  const neonClient = Neon(apiKey);
  const endpointsResponse = (await neonClient.branch.listProjectBranchEndpoints(
    projectId,
    branchId
  )) as EndpointsResponse;
  const existingEndpoints = endpointsResponse.endpoints;

  for (const existingEndpoint of existingEndpoints) {
    if (existingEndpoint.type === 'read_write') {
      const readWriteOptionIndex = endpointOptions.findIndex(
        (option) => option.type === 'read_write'
      );
      const readWriteOption = endpointOptions[readWriteOptionIndex];
      if (readWriteOption) {
        endpointOptions = endpointOptions.filter((_, index) => index !== readWriteOptionIndex);
        await neonClient.endpoint.updateProjectEndpoint(projectId, existingEndpoint.id, {
          endpoint: {
            provisioner: readWriteOption.provisioner || 'k8s-neonvm',
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
        await neonClient.endpoint.updateProjectEndpoint(projectId, existingEndpoint.id, {
          endpoint: {
            provisioner: readOnlyOption.provisioner || 'k8s-neonvm',
            autoscaling_limit_min_cu: readOnlyOption.autoscaling_limit_min_cu || 0.25,
            autoscaling_limit_max_cu: readOnlyOption.autoscaling_limit_max_cu || 1,
            suspend_timeout_seconds: readOnlyOption.suspend_timeout_seconds || 0
          }
        });
      } else {
        await neonClient.endpoint.deleteProjectEndpoint(projectId, existingEndpoint.id);
      }
    } else {
      throw new Error(`Unknown endpoint type ${existingEndpoint.type}`);
    }
  }

  // Create any new endpoints
  for (const endpointOption of endpointOptions) {
    await neonClient.endpoint.createProjectEndpoint(projectId, {
      endpoint: {
        branch_id: branchId,
        type: endpointOption.type,
        provisioner: endpointOption.provisioner || 'k8s-neonvm',
        autoscaling_limit_min_cu: endpointOption.autoscaling_limit_min_cu || 0.25,
        autoscaling_limit_max_cu: endpointOption.autoscaling_limit_max_cu || 1,
        suspend_timeout_seconds: endpointOption.suspend_timeout_seconds || 0
      }
    });
  }

  return await getBranch(apiKey, projectId, branchId);
}

export async function deleteBranch(apiKey: string, projectId: string, branchId: string) {
  const branch = await getBranch(apiKey, projectId, branchId);

  const neonClient = Neon(apiKey);
  const endpointsResponse = (await neonClient.branch.listProjectBranchEndpoints(
    projectId,
    branch.id
  )) as EndpointsResponse;
  const endpoints = endpointsResponse.endpoints;
  for (const endpoint of endpoints) {
    await neonClient.endpoint.deleteProjectEndpoint(projectId, endpoint.id);
  }

  await neonClient.branch.deleteProjectBranch(projectId, branch.id);
}

export async function getAllNeonConnectionUrls(
  apiKey: string,
  projectId: string,
  branchId: string,
  roleName: string
): Promise<NeonConnectionUrl[]> {
  const neonClient = Neon(apiKey);
  const endpointsResponse = (await neonClient.branch.listProjectBranchEndpoints(
    projectId,
    branchId
  )) as EndpointsResponse;
  const endpoints = endpointsResponse.endpoints;

  const rolesResponse = (await neonClient.branch.listProjectBranchRoles(
    projectId,
    branchId
  )) as RolesResponse;
  const role = rolesResponse.roles.find((role) => role.name === roleName);
  if (!role) {
    throw new Error(`DB Role '${roleName}' not found. All roles: ${JSON.stringify(rolesResponse)}`);
  }

  let rolePassword = role.password;
  if (!rolePassword) {
    const rolePasswordResponse = (await neonClient.branch.getProjectBranchRolePassword(
      projectId,
      branchId,
      role.name
    )) as RolePasswordResponse;
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

  const databasesResponse = (await neonClient.branch.listProjectBranchDatabases(
    projectId,
    branchId
  )) as DatabasesResponse;
  const databases = databasesResponse.databases;

  return formConnectionUrls(databases, endpoints, role);
}

function formConnectionUrls(databases: Database[], endpoints: Endpoint[], role: Role) {
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
        type: determineDbType(database.name, endpoint.type),
        url: `postgres://${role.name}:${role.password}@${host}/${database.name}?sslmode=require`
      });
    }
  }
  return connectionUrls;
}

function determineDbType(databaseName: string, endpointType: EndpointType): DatabaseType {
  if (databaseName.includes('vectors')) {
    if (endpointType === 'read_write') {
      return DatabaseType.VECTOR_READWRITE;
    } else {
      return DatabaseType.VECTOR_READONLY;
    }
  } else {
    if (endpointType === 'read_write') {
      return DatabaseType.READWRITE;
    } else {
      return DatabaseType.READONLY;
    }
  }
}

function getDatabasesFromConnectionUrls(connectionUrls: NeonConnectionUrl[]) {
  const dbReadWriteUrl = connectionUrls.find((url) => url.type === DatabaseType.READWRITE)?.url;
  if (!dbReadWriteUrl) {
    throw new Error('No readwrite database found');
  }
  const dbReadOnlyUrl =
    connectionUrls.find((url) => url.type === DatabaseType.READONLY)?.url || dbReadWriteUrl;

  const vectorDbReadWriteUrl = connectionUrls.find(
    (url) => url.type === DatabaseType.VECTOR_READWRITE
  )?.url;
  if (!vectorDbReadWriteUrl) {
    throw new Error('No vector readwrite database found');
  }
  const vectorDbReadOnlyUrl =
    connectionUrls.find((url) => url.type === DatabaseType.VECTOR_READONLY)?.url ||
    vectorDbReadWriteUrl;

  return {
    dbReadOnlyUrl,
    dbReadWriteUrl,
    vectorDbReadOnlyUrl,
    vectorDbReadWriteUrl
  };
}
