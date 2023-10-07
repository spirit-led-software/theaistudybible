import type {
  CdkCustomResourceHandler,
  CdkCustomResourceResponse,
} from "aws-lambda";
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
  type RolesResponse,
} from "neon-sdk";

const Neon = (apiKey: string) =>
  new NeonClient({
    TOKEN: apiKey,
  });

export enum DatabaseType {
  READWRITE,
  READONLY,
  VECTOR_READWRITE,
  VECTOR_READONLY,
}

export type NeonConnectionUrl = {
  type: DatabaseType;
  url: string;
};

export const handler: CdkCustomResourceHandler = async (event) => {
  console.log("Received event from custom resource:", JSON.stringify(event));

  const response: CdkCustomResourceResponse = {
    StackId: event.StackId,
    RequestId: event.RequestId,
    LogicalResourceId: event.LogicalResourceId,
  };
  try {
    const projectName = event.ResourceProperties.projectName as string;
    const branchName = event.ResourceProperties.branchName as string;
    const roleName = event.ResourceProperties.roleName as string;
    const isProd = event.ResourceProperties.isProd === "true";
    const apiKey = event.ResourceProperties.apiKey as string;

    console.log(
      `Neon branch inputs: projectName=${projectName}, branchName=${branchName}, roleName=${roleName}, isProd=${isProd}`
    );

    const project = await getProjectByName(apiKey, projectName);
    if (!project) {
      response.Status = "FAILED";
      response.Reason = `Project ${projectName} not found`;
      return response;
    }

    switch (event.RequestType) {
      case "Delete": {
        if (!isProd) {
          const branch = await getBranchByName(apiKey, project.id, branchName);
          if (!branch) {
            response.Status = "FAILED";
            response.Reason = `Branch ${branchName} not found`;
            break;
          }
          await deleteBranch(apiKey, project.id, branch.id);
        }
        response.Status = "SUCCESS";
        break;
      }
      default: {
        let branch = await getBranchByName(apiKey, project.id, branchName);
        if (!branch) {
          branch = await createBranch(apiKey, project.id, branchName, isProd);
        } else {
          branch = await updateBranch(apiKey, project.id, branch.id, isProd);
        }
        const connectionUrls = await getAllNeonConnectionUrls(
          apiKey,
          project.id,
          branch.id,
          roleName
        );
        const urls = getDatabasesFromConnectionUrls(connectionUrls);

        response.Status = "SUCCESS";
        response.Data = {
          projectId: project.id,
          ...urls,
        };
        break;
      }
    }
    console.log("Response from custom resource:", response);
    return response;
  } catch (error: any) {
    console.error(error);
    response.Status = "FAILED";
    response.Reason = error.message;
    response.Data = {
      stack: error.stack,
    };
    return response;
  }
};

export async function getProjectByName(apiKey: string, projectName: string) {
  const neonClient = Neon(apiKey);
  const listProjectsResponse =
    (await neonClient.project.listProjects()) as ProjectsResponse;
  const project = listProjectsResponse.projects.find(
    (project) => project.name === projectName
  );
  return project;
}

export async function getBranch(
  apiKey: string,
  projectId: string,
  branchId: string
) {
  const neonClient = Neon(apiKey);
  const branchResponse = (await neonClient.branch.getProjectBranch(
    projectId,
    branchId
  )) as BranchResponse;
  return branchResponse.branch;
}

export async function getBranchByName(
  apiKey: string,
  projectId: string,
  branchName: string
) {
  const neonClient = Neon(apiKey);
  const branches = (await neonClient.branch.listProjectBranches(
    projectId
  )) as BranchesResponse;
  const branch = branches.branches.find((branch) => branch.name === branchName);
  return branch;
}

export async function createBranch(
  apiKey: string,
  projectId: string,
  branchName: string,
  isProd: boolean
) {
  const neonClient = Neon(apiKey);
  const endpoints: BranchCreateRequestEndpointOptions[] = [
    {
      type: "read_write",
      provisioner: "k8s-neonvm",
      autoscaling_limit_min_cu: isProd ? 2 : 0.25,
      autoscaling_limit_max_cu: isProd ? 7 : 1,
      suspend_timeout_seconds: 0,
    },
  ];

  if (isProd) {
    endpoints.push({
      type: "read_only",
      provisioner: "k8s-neonvm",
      autoscaling_limit_min_cu: 2,
      autoscaling_limit_max_cu: 7,
      suspend_timeout_seconds: 0,
    });
  }
  const createBranchResponse = (await neonClient.branch.createProjectBranch(
    projectId,
    {
      branch: {
        name: branchName,
      },
      endpoints,
    }
  )) as BranchResponse;
  return createBranchResponse.branch;
}

export async function updateBranch(
  apiKey: string,
  projectId: string,
  branchId: string,
  isProd: boolean
) {
  const neonClient = Neon(apiKey);
  const endpointsResponse = (await neonClient.branch.listProjectBranchEndpoints(
    projectId,
    branchId
  )) as EndpointsResponse;
  const endpoints = endpointsResponse.endpoints;

  for (const endpoint of endpoints) {
    if (endpoint.type === "read_write") {
      await neonClient.endpoint.updateProjectEndpoint(projectId, endpoint.id, {
        endpoint: {
          provisioner: "k8s-neonvm",
          autoscaling_limit_min_cu: isProd ? 2 : 0.25,
          autoscaling_limit_max_cu: isProd ? 7 : 1,
          suspend_timeout_seconds: 0,
        },
      });
    } else if (endpoint.type === "read_only") {
      if (isProd) {
        await neonClient.endpoint.updateProjectEndpoint(
          projectId,
          endpoint.id,
          {
            endpoint: {
              provisioner: "k8s-neonvm",
              autoscaling_limit_min_cu: 2,
              autoscaling_limit_max_cu: 7,
              suspend_timeout_seconds: 0,
            },
          }
        );
      } else {
        await neonClient.endpoint.deleteProjectEndpoint(projectId, endpoint.id);
      }
    } else {
      throw new Error(`Unknown endpoint type ${endpoint.type}`);
    }
  }
  return await getBranch(apiKey, projectId, branchId);
}

export async function deleteBranch(
  apiKey: string,
  projectId: string,
  branchId: string
) {
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
    throw new Error(
      `DB Role '${roleName}' not found. All roles: ${JSON.stringify(
        rolesResponse
      )}`
    );
  }

  let rolePassword = role.password;
  if (!rolePassword) {
    const rolePasswordResponse =
      (await neonClient.branch.getProjectBranchRolePassword(
        projectId,
        branchId,
        role.name
      )) as RolePasswordResponse;
    rolePassword = rolePasswordResponse.password;
    if (!rolePassword) {
      throw new Error(
        `DB Role '${
          role.name
        }' password could not be obtained: ${JSON.stringify(
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

function formConnectionUrls(
  databases: Database[],
  endpoints: Endpoint[],
  role: Role
) {
  console.log(
    `Forming connection urls for databases: ${JSON.stringify(
      databases
    )}, endpoints: ${JSON.stringify(endpoints)}, role: ${JSON.stringify(role)}`
  );
  const connectionUrls: NeonConnectionUrl[] = [];
  for (const database of databases) {
    for (const endpoint of endpoints) {
      // Below is implementation for pgbouncer.
      const hostPieces = endpoint.host.split(".");
      const host = `${hostPieces[0]}-pooler.${hostPieces.slice(1).join(".")}`;

      connectionUrls.push({
        type: determineDbType(database.name, endpoint.type),
        url: `postgres://${role.name}:${role.password}@${host}/${
          database.name
        }?options=${encodeURIComponent(`endpoint=${endpoint.id}-pooler`)}`,
      });
    }
  }
  return connectionUrls;
}

function determineDbType(
  databaseName: string,
  endpointType: EndpointType
): DatabaseType {
  if (databaseName.includes("vectors")) {
    if (endpointType === "read_write") {
      return DatabaseType.VECTOR_READWRITE;
    } else {
      return DatabaseType.VECTOR_READONLY;
    }
  } else {
    if (endpointType === "read_write") {
      return DatabaseType.READWRITE;
    } else {
      return DatabaseType.READONLY;
    }
  }
}

function getDatabasesFromConnectionUrls(connectionUrls: NeonConnectionUrl[]) {
  const dbReadWriteUrl = connectionUrls.find(
    (url) => url.type === DatabaseType.READWRITE
  )?.url;
  if (!dbReadWriteUrl) {
    throw new Error("No readwrite database found");
  }
  const dbReadOnlyUrl =
    connectionUrls.find((url) => url.type === DatabaseType.READONLY)?.url ||
    dbReadWriteUrl;

  const vectorDbReadWriteUrl = connectionUrls.find(
    (url) => url.type === DatabaseType.VECTOR_READWRITE
  )?.url;
  if (!vectorDbReadWriteUrl) {
    throw new Error("No vector readwrite database found");
  }
  const vectorDbReadOnlyUrl =
    connectionUrls.find((url) => url.type === DatabaseType.VECTOR_READONLY)
      ?.url || vectorDbReadWriteUrl;

  return {
    dbReadOnlyUrl,
    dbReadWriteUrl,
    vectorDbReadOnlyUrl,
    vectorDbReadWriteUrl,
  };
}
