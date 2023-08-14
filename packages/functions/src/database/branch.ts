import {
  CdkCustomResourceHandler,
  CdkCustomResourceResponse,
} from "aws-lambda";
import {
  BranchCreateRequestEndpointOptions,
  BranchResponse,
  BranchesResponse,
  Database,
  DatabasesResponse,
  Endpoint,
  EndpointType,
  EndpointsResponse,
  NeonClient,
  ProjectsResponse,
  Role,
  RolePasswordResponse,
  RolesResponse,
} from "neon-sdk";

const Neon = () =>
  new NeonClient({
    TOKEN: process.env.NEON_API_KEY!,
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

    console.log(
      `Neon branch inputs: projectName=${projectName}, branchName=${branchName}, roleName=${roleName}, isProd=${isProd}`
    );

    const project = await getProjectByName(projectName);
    switch (event.RequestType) {
      case "Delete": {
        if (!isProd) {
          const branch = await getBranchByName(project.id, branchName);
          if (!branch) {
            response.Status = "FAILED";
            response.Reason = `Branch ${branchName} not found`;
            break;
          }
          await deleteBranch(project.id, branch.id);
        }
        response.Status = "SUCCESS";
        break;
      }
      default: {
        let branch = await getBranchByName(project.id, branchName);
        if (!branch) {
          branch = await createBranch(project.id, branchName, isProd);
        } else {
          branch = await updateBranch(project.id, branch.id, isProd);
        }
        const connectionUrls = await getAllNeonConnectionUrls(
          project.id,
          branch.id,
          project.id
        );
        const urls = getDatabasesFromConnectionUrls(connectionUrls);

        response.Status = "SUCCESS";
        response.Data = {
          projectId: project.id,
          ...urls,
        };
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

export async function getProjectByName(projectName: string) {
  const neonClient = Neon();
  const listProjectsResponse =
    (await neonClient.project.listProjects()) as ProjectsResponse;
  const project = listProjectsResponse.projects.find(
    (project) => project.name === projectName
  );
  if (!project) {
    throw new Error(
      `Project ${projectName} not found. All projects: ${JSON.stringify(
        listProjectsResponse
      )}`
    );
  }
  return project;
}

export async function getBranch(projectId: string, branchId: string) {
  const neonClient = Neon();
  const branchResponse = (await neonClient.branch.getProjectBranch(
    projectId,
    branchId
  )) as BranchResponse;
  return branchResponse.branch;
}

export async function getBranchByName(projectId: string, branchName: string) {
  const neonClient = Neon();
  const branches = (await neonClient.branch.listProjectBranches(
    projectId
  )) as BranchesResponse;
  const branch = branches.branches.find((branch) => branch.name === branchName);
  return branch;
}

export async function createBranch(
  projectId: string,
  branchName: string,
  isProd: boolean
) {
  const neonClient = Neon();
  const endpoints: BranchCreateRequestEndpointOptions[] = [
    {
      type: "read_write",
      provisioner: isProd ? "k8s-neonvm" : "k8s-pod",
      autoscaling_limit_min_cu: isProd ? 0.5 : 0.5,
      autoscaling_limit_max_cu: isProd ? 7 : 0.5,
      suspend_timeout_seconds: 0,
    },
  ];

  if (isProd) {
    endpoints.push({
      type: "read_only",
      provisioner: "k8s-neonvm",
      autoscaling_limit_min_cu: 0.5,
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
  projectId: string,
  branchId: string,
  isProd: boolean
) {
  const branch = await getBranch(projectId, branchId);

  const neonClient = Neon();
  const endpointsResponse = (await neonClient.branch.listProjectBranchEndpoints(
    projectId,
    branch.id
  )) as EndpointsResponse;
  const endpoints = endpointsResponse.endpoints;

  for (const endpoint of endpoints) {
    if (endpoint.type === "read_only" && !isProd) {
      await neonClient.endpoint.deleteProjectEndpoint(projectId, endpoint.id);
    }

    if (endpoint.type === "read_write") {
      await neonClient.endpoint.updateProjectEndpoint(projectId, endpoint.id, {
        endpoint: {
          provisioner: isProd ? "k8s-neonvm" : "k8s-pod",
          autoscaling_limit_min_cu: isProd ? 0.5 : 0.5,
          autoscaling_limit_max_cu: isProd ? 7 : 0.5,
        },
      });
    } else if (endpoint.type === "read_only") {
      await neonClient.endpoint.updateProjectEndpoint(projectId, endpoint.id, {
        endpoint: {
          provisioner: isProd ? "k8s-neonvm" : "k8s-pod",
          autoscaling_limit_min_cu: isProd ? 0.5 : 0.5,
          autoscaling_limit_max_cu: isProd ? 7 : 0.5,
        },
      });
    } else {
      throw new Error(`Unknown endpoint type ${endpoint.type}`);
    }
  }

  return branch;
}

export async function deleteBranch(projectId: string, branchId: string) {
  const branch = await getBranch(projectId, branchId);

  const neonClient = Neon();
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
  projectId: string,
  branchId: string,
  roleName: string
): Promise<NeonConnectionUrl[]> {
  const branch = await getBranch(projectId, branchId);

  const neonClient = Neon();
  const endpointsResponse = (await neonClient.branch.listProjectBranchEndpoints(
    projectId,
    branch.id
  )) as EndpointsResponse;
  const endpoints = endpointsResponse.endpoints;

  const rolesResponse = (await neonClient.branch.listProjectBranchRoles(
    projectId,
    branch.id
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
        branch.id,
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
    branch.id
  )) as DatabasesResponse;
  const databases = databasesResponse.databases;

  return formConnectionUrls(databases, endpoints, role);
}

function formConnectionUrls(
  databases: Database[],
  endpoints: Endpoint[],
  role: Role
) {
  const connectionUrls: NeonConnectionUrl[] = [];
  for (const database of databases) {
    for (const endpoint of endpoints) {
      connectionUrls.push({
        type: determineDbType(database.name, endpoint.type),
        url: `postgres://${role.name}:${role.password}@${endpoint.host}/${database.name}`,
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
