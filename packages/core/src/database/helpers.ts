import { SQL, and, asc, desc, eq, gt, gte, ilike, like, lt, lte, not, or } from 'drizzle-orm';
import type { PgTableWithColumns } from 'drizzle-orm/pg-core';

export interface ColumnValue {
  column: string;
  value: unknown;
}

export interface ColumnPlaceHolder {
  column: string;
  placeholder: string;
}

export interface Query {
  AND?: Query[];
  OR?: Query[];
  NOT?: Query;
  eq?: ColumnValue;
  neq?: ColumnValue;
  gt?: ColumnValue;
  gte?: ColumnValue;
  lt?: ColumnValue;
  lte?: ColumnValue;
  like?: ColumnPlaceHolder;
  iLike?: ColumnPlaceHolder;
  notLike?: ColumnPlaceHolder;
}

export function buildQuery(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  table: PgTableWithColumns<any>,
  query: Query
): SQL<unknown> | undefined {
  if (query.AND && query.OR) {
    throw new Error('Cannot have both AND and OR at the top level of a query');
  }

  if ((query.AND || query.OR) && query.NOT) {
    throw new Error('Cannot have both AND/OR and NOT at the top level of a query');
  }

  if (query.AND) {
    return and(...query.AND.map((q) => buildQuery(table, q)));
  }
  if (query.OR) {
    return or(...query.OR.map((q) => buildQuery(table, q)));
  }
  if (query.NOT) {
    return not(buildQuery(table, query.NOT)!);
  }

  if (query.eq) {
    return eq(table[query.eq.column], query.eq.value);
  }

  if (query.gt) {
    return gt(table[query.gt.column], query.gt.value);
  }

  if (query.gte) {
    return gte(table[query.gte.column], query.gte.value);
  }

  if (query.lt) {
    return lt(table[query.lt.column], query.lt.value);
  }

  if (query.lte) {
    return lte(table[query.lte.column], query.lte.value);
  }

  if (query.like) {
    return like(table[query.like.column], query.like.placeholder);
  }

  if (query.iLike) {
    return ilike(table[query.iLike.column], query.iLike.placeholder);
  }

  if (query.notLike) {
    return not(like(table[query.notLike.column], query.notLike.placeholder));
  }
}

export function buildOrderBy(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  table: PgTableWithColumns<any>,
  orderBy: string,
  order: string
): SQL<unknown> {
  if (!table[orderBy]) {
    throw new Error(`Cannot order by ${orderBy} on table ${table.name}`);
  }

  if (order === 'asc') {
    return asc(table[orderBy]);
  } else if (order === 'desc') {
    return desc(table[orderBy]);
  } else {
    throw new Error(`Invalid order operator ${order}`);
  }
}
