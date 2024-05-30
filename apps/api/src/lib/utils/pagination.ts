import type { Table } from 'drizzle-orm';
import { z } from 'zod';
import { parseFilterString } from './filter';
import { parseSortString } from './sort';

export function PaginationSchema<T extends Table>(
  table: T,
  options?: {
    limit?: number;
    cursor?: number;
  }
) {
  return z
    .object({
      cursor: z
        .string()
        .optional()
        .transform((v) => (v ? parseInt(v) : options?.cursor || 0)),
      limit: z
        .string()
        .optional()
        .transform((v) => (v ? parseInt(v) : options?.limit || 10)),
      filter: z
        .string()
        .optional()
        .transform((v) => (v ? parseFilterString(table, v) : undefined)),
      sort: z
        .string()
        .optional()
        .transform((v) => (v ? parseSortString(table, v) : undefined))
    })
    .optional()
    .transform(
      (v) =>
        v || {
          cursor: options?.cursor || 0,
          limit: options?.limit || 10,
          filter: undefined,
          sort: undefined
        }
    );
}

export function PaginationSchemaNoDefault<T extends Table>(
  table: T,
  options?: { limit?: number; cursor?: number }
) {
  return z.object({
    cursor: z
      .string()
      .optional()
      .transform((v) => (v ? parseInt(v) : options?.cursor || 0)),
    limit: z
      .string()
      .optional()
      .transform((v) => (v ? parseInt(v) : options?.limit || 10)),
    filter: z
      .string()
      .optional()
      .transform((v) => (v ? parseFilterString(table, v) : undefined)),
    sort: z
      .string()
      .optional()
      .transform((v) => (v ? parseSortString(table, v) : undefined))
  });
}
