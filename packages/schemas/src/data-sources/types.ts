import type { z } from 'zod';
import type {
  CreateDataSourceSchema,
  DataSourceSchema,
  UpdateDataSourceSchema,
} from './data-sources';
import type {
  CreateIndexOperationSchema,
  IndexOperationSchema,
  UpdateIndexOperationSchema,
} from './index-operations';

export type DataSource = z.infer<typeof DataSourceSchema>;
export type CreateDataSource = z.infer<typeof CreateDataSourceSchema>;
export type UpdateDataSource = z.infer<typeof UpdateDataSourceSchema>;

export type IndexOperation = z.infer<typeof IndexOperationSchema>;
export type CreateIndexOperation = z.infer<typeof CreateIndexOperationSchema>;
export type UpdateIndexOperation = z.infer<typeof UpdateIndexOperationSchema>;
