import type {
  CreateDataSourceData,
  DataSource,
  UpdateDataSourceData
} from '@revelationsai/core/model/data-source';
import apiConfig from '../../../configs/api';
import type { ProtectedApiOptions } from '../../types';

export async function createDataSource(data: CreateDataSourceData, options: ProtectedApiOptions) {
  const response = await fetch(`${apiConfig.url}/admin/data-sources`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${options.session}`
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    console.error(
      `Error creating data source. Received response: ${response.status} ${response.statusText}`
    );
    const data = (await response.json()) as { error?: string };
    throw new Error(data.error || 'Error creating data source.');
  }

  const dataSource = (await response.json()) as DataSource;

  return dataSource;
}

export async function updateDataSource(
  id: string,
  data: Partial<UpdateDataSourceData>,
  options: ProtectedApiOptions
) {
  const response = await fetch(`${apiConfig.url}/admin/data-sources/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${options.session}`
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    console.error(
      `Error updating data source. Received response: ${response.status} ${response.statusText}`
    );
    const data = (await response.json()) as { error?: string };
    throw new Error(data.error || 'Error updating data source.');
  }

  const dataSource = (await response.json()) as DataSource;

  return dataSource;
}

export async function deleteDataSource(id: string, options: ProtectedApiOptions) {
  const response = await fetch(`${apiConfig.url}/admin/data-sources/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${options.session}`
    }
  });

  if (!response.ok) {
    console.error(
      `Error deleting data source. Received response: ${response.status} ${response.statusText}`
    );
    const data = (await response.json()) as { error?: string };
    throw new Error(data.error || 'Error deleting data source.');
  }

  return true;
}

export async function syncDataSource(id: string, options: ProtectedApiOptions) {
  const response = await fetch(`${apiConfig.url}/admin/data-sources/${id}/sync`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${options.session}`
    }
  });

  if (!response.ok) {
    console.error(
      `Error syncing data source. Received response: ${response.status} ${response.statusText}`
    );
    const data = (await response.json()) as { error?: string };
    throw new Error(data.error || 'Error syncing data source.');
  }

  const dataSource = (await response.json()) as DataSource;

  return dataSource;
}
