import {
  BranchCreateRequest,
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
import { App, Stack } from "sst/constructs";

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

export async function getAllNeonConnectionUrls(
  app: App,
  stack: Stack
): Promise<NeonConnectionUrl[]> {
  const neonClient = Neon();
  const listProjectsResponse =
    (await neonClient.project.listProjects()) as ProjectsResponse;
  const project = listProjectsResponse.projects.find(
    (project) => project.name === app.name
  );
  if (!project) {
    throw new Error(
      `Project ${app.name} not found. All projects: ${JSON.stringify(
        listProjectsResponse
      )}`
    );
  }

  const branchName = stack.stage === "prod" ? "main" : stack.stage;
  const branches = (await neonClient.branch.listProjectBranches(
    project.id
  )) as BranchesResponse;
  let branch = branches.branches.find((branch) => branch.name === branchName);
  if (!branch) {
    branch = await createNeonBranch(project.id, branchName, stack);
  }

  const endpointsResponse = (await neonClient.branch.listProjectBranchEndpoints(
    project.id,
    branch.id
  )) as EndpointsResponse;
  const endpoints = endpointsResponse.endpoints;

  const rolesResponse = (await neonClient.branch.listProjectBranchRoles(
    project.id,
    branch.id
  )) as RolesResponse;
  const role = rolesResponse.roles.find((role) => role.name === app.name);
  if (!role) {
    throw new Error(
      `DB Role '${app.name}' not found. All roles: ${JSON.stringify(
        rolesResponse
      )}`
    );
  }

  let rolePassword = role.password;
  if (!rolePassword) {
    const rolePasswordResponse =
      (await neonClient.branch.getProjectBranchRolePassword(
        project.id,
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
    project.id,
    branch.id
  )) as DatabasesResponse;
  const databases = databasesResponse.databases;

  return formConnectionUrls(databases, endpoints, role);
}

async function createNeonBranch(
  projectId: string,
  branchName: string,
  stack: Stack
) {
  const neonClient = Neon();
  const endpoints: BranchCreateRequestEndpointOptions[] = [
    {
      type: "read_write",
      provisioner: stack.stage === "prod" ? "k8s-neonvm" : "k8s-pod",
      autoscaling_limit_min_cu: stack.stage === "prod" ? 0.5 : 0.25,
      autoscaling_limit_max_cu: stack.stage === "prod" ? 7 : 0.25,
      suspend_timeout_seconds: 0,
    },
  ];
  // Add read only endpoint for prod environments
  if (stack.stage === "prod") {
    endpoints.push({
      type: "read_only",
      provisioner: "k8s-neonvm",
      autoscaling_limit_min_cu: 0.25,
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
    } satisfies BranchCreateRequest
  )) as BranchResponse;
  return createBranchResponse.branch;
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
