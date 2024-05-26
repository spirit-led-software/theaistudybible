import type {
  BranchCreateRequest,
  BranchOperations,
  BranchResponse,
  BranchUpdateRequest,
  BranchesResponse,
  DatabasesResponse,
  EndpointCreateRequest,
  EndpointOperations,
  EndpointUpdateRequest,
  EndpointsResponse,
  ListProjectsParams,
  PaginationResponse,
  ProjectResponse,
  ProjectsResponse,
  RolePasswordResponse,
  RolesResponse
} from '@neondatabase/api-client';

export class NeonClient {
  private readonly apiKey: string;
  public readonly baseUrl = 'https://console.neon.tech/api/v2';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async listProjects(options?: ListProjectsParams) {
    const queryParams = this.formatQueryParams(options);
    const res = await fetch(`${this.baseUrl}/projects?${queryParams}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${this.apiKey}`
      }
    });

    if (!res.ok) {
      throw new Error(`Failed to list projects: ${res.statusText}`);
    }

    return (await res.json()) as ProjectsResponse;
  }

  async getProject(projectId: string) {
    const res = await fetch(`${this.baseUrl}/projects/${projectId}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${this.apiKey}`
      }
    });

    if (!res.ok) {
      throw new Error(`Failed to get project: ${res.statusText}`);
    }

    return (await res.json()) as ProjectResponse & PaginationResponse;
  }

  async listProjectBranches(projectId: string) {
    const res = await fetch(`${this.baseUrl}/projects/${projectId}/branches`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${this.apiKey}`
      }
    });

    if (!res.ok) {
      throw new Error(`Failed to list project branches: ${res.statusText}`);
    }

    return (await res.json()) as BranchesResponse;
  }

  async getProjectBranch(projectId: string, branchId: string) {
    const res = await fetch(`${this.baseUrl}/projects/${projectId}/branches/${branchId}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${this.apiKey}`
      }
    });

    if (!res.ok) {
      throw new Error(`Failed to get project branch: ${res.statusText}`);
    }

    return (await res.json()) as BranchResponse;
  }

  async createProjectBranch(projectId: string, options: BranchCreateRequest) {
    const res = await fetch(`${this.baseUrl}/projects/${projectId}/branches`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(options)
    });

    if (!res.ok) {
      throw new Error(`Failed to create project branch: ${res.statusText}`);
    }

    return (await res.json()) as BranchResponse;
  }

  async updateProjectBranch(projectId: string, branchId: string, options: BranchUpdateRequest) {
    const res = await fetch(`${this.baseUrl}/projects/${projectId}/branches/${branchId}`, {
      method: 'PATCH',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(options)
    });

    if (!res.ok) {
      throw new Error(`Failed to update project branch: ${res.statusText}`);
    }

    return (await res.json()) as BranchOperations;
  }

  async deleteProjectBranch(projectId: string, branchId: string) {
    const res = await fetch(`${this.baseUrl}/projects/${projectId}/branches/${branchId}`, {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${this.apiKey}`
      }
    });

    if (!res.ok) {
      throw new Error(`Failed to delete project branch: ${res.statusText}`);
    }

    return (await res.json()) as BranchOperations;
  }

  async listProjectBranchRoles(projectId: string, branchId: string) {
    const res = await fetch(`${this.baseUrl}/projects/${projectId}/branches/${branchId}/roles`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${this.apiKey}`
      }
    });

    if (!res.ok) {
      throw new Error(`Failed to list project branch roles: ${res.statusText}`);
    }

    return (await res.json()) as RolesResponse;
  }

  async getProjectBranchRolePassword(projectId: string, branchId: string, roleName: string) {
    const res = await fetch(
      `${this.baseUrl}/projects/${projectId}/branches/${branchId}/roles/${roleName}/reveal_password`,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${this.apiKey}`
        }
      }
    );

    if (!res.ok) {
      throw new Error(`Failed to get project branch role password: ${res.statusText}`);
    }

    return (await res.json()) as RolePasswordResponse;
  }

  async listProjectBranchDatabases(projectId: string, branchId: string) {
    const res = await fetch(
      `${this.baseUrl}/projects/${projectId}/branches/${branchId}/databases`,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${this.apiKey}`
        }
      }
    );

    if (!res.ok) {
      throw new Error(`Failed to list project branch databases: ${res.statusText}`);
    }

    return (await res.json()) as DatabasesResponse;
  }

  async listProjectBranchEndpoints(projectId: string, branchId: string) {
    const res = await fetch(
      `${this.baseUrl}/projects/${projectId}/branches/${branchId}/endpoints`,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${this.apiKey}`
        }
      }
    );

    if (!res.ok) {
      throw new Error(`Failed to list project branch endpoints: ${res.statusText}`);
    }

    return (await res.json()) as EndpointsResponse;
  }

  async createProjectEndpoint(projectId: string, options: EndpointCreateRequest) {
    const res = await fetch(`${this.baseUrl}/projects/${projectId}/endpoints`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(options)
    });

    if (!res.ok) {
      throw new Error(`Failed to create project endpoint: ${res.statusText}`);
    }

    return (await res.json()) as EndpointOperations;
  }

  async updateProjectEndpoint(
    projectId: string,
    endpointId: string,
    options: EndpointUpdateRequest
  ) {
    const res = await fetch(`${this.baseUrl}/projects/${projectId}/endpoints/${endpointId}`, {
      method: 'PATCH',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(options)
    });

    if (!res.ok) {
      throw new Error(`Failed to update project endpoint: ${res.statusText}`);
    }

    return (await res.json()) as EndpointOperations;
  }

  async deleteProjectEndpoint(projectId: string, endpointId: string) {
    const res = await fetch(`${this.baseUrl}/projects/${projectId}/endpoints/${endpointId}`, {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${this.apiKey}`
      }
    });

    if (!res.ok) {
      throw new Error(`Failed to delete project endpoint: ${res.statusText}`);
    }

    return (await res.json()) as EndpointOperations;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private formatQueryParams(params?: any) {
    if (!params) {
      return '';
    }
    return Object.keys(params)
      .map((key) => `${key}=${encodeURIComponent(params[key])}`)
      .join('&');
  }
}
