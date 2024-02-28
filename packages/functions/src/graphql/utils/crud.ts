import { buildOrderBy, buildQuery } from '@revelationsai/core/database/helpers';
import type { UserWithRoles } from '@revelationsai/core/model/user';
import { db } from '@revelationsai/server/lib/database';
import { isAdminSync } from '@revelationsai/server/services/user';
import { SQL, and, desc, eq } from 'drizzle-orm';
import type { PgTableWithColumns, PgUpdateSetSource } from 'drizzle-orm/pg-core';
import type { z } from 'zod';
import type { FilterInput, SortInput } from '../__generated__/resolver-types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getObjects<Table extends PgTableWithColumns<any>>(options: {
  currentUser: UserWithRoles | undefined;
  role: 'admin' | 'user' | 'public';
  table: Table;
  where?: SQL<unknown>;
  filter?: FilterInput | null;
  limit?: number | null;
  page?: number | null;
  sort?: SortInput[] | null;
}): Promise<Table['$inferSelect'][]>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getObjects<Table extends PgTableWithColumns<any>>(options: {
  currentUser?: UserWithRoles;
  role: 'owner';
  table: Table;
  where?: SQL<unknown>;
  filter?: FilterInput | null;
  limit?: number | null;
  page?: number | null;
  sort?: SortInput[] | null;
  ownershipField?: keyof Table['$inferSelect'];
}): Promise<Table['$inferSelect'][]>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getObjects<Table extends PgTableWithColumns<any>, ParentType>(options: {
  currentUser?: UserWithRoles;
  role: 'parent-owner';
  parent: ParentType;
  table: Table;
  where?: SQL<unknown>;
  filter?: FilterInput | null;
  limit?: number | null;
  page?: number | null;
  sort?: SortInput[] | null;
  ownershipField?: keyof ParentType;
}): Promise<Table['$inferSelect'][]>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getObjects<Table extends PgTableWithColumns<any>, ParentType>(options: {
  currentUser?: UserWithRoles;
  role: 'admin' | 'owner' | 'parent-owner' | 'user' | 'public';
  parent?: ParentType;
  table: Table;
  where?: SQL<unknown>;
  filter?: FilterInput | null;
  limit?: number | null;
  page?: number | null;
  sort?: SortInput[] | null;
  ownershipField?: keyof Table['$inferSelect'] | keyof ParentType;
}): Promise<Table['$inferSelect'][]> {
  const { currentUser, role, parent, table, filter, sort, ownershipField = 'userId' } = options;

  if (role !== 'public' && !currentUser) {
    throw new Error('You must be logged in to perform this action');
  }

  if (role === 'admin' && !isAdminSync(currentUser!)) {
    throw new Error('You are not authorized to perform this action');
  }

  if (
    role === 'parent-owner' &&
    (!parent ||
      (parent[ownershipField as keyof ParentType] !== currentUser!.id &&
        !isAdminSync(currentUser!)))
  ) {
    throw new Error('You are not authorized to perform this action');
  }

  let where: SQL<unknown> | undefined = options.where;
  if (role === 'owner' && !isAdminSync(currentUser!)) {
    const ownerWhere = eq(table[ownershipField], currentUser!.id);
    where = where ? and(where, ownerWhere) : ownerWhere;
  }
  if (filter) {
    const filterWhere = buildQuery(table, filter);
    where = where ? and(where, filterWhere) : filterWhere;
  }
  const orderBy = sort?.map((s) => buildOrderBy(table, s.field, s.order)) ?? [
    desc(table.createdAt ?? table.id)
  ];
  const limit = options.limit || 25;
  const page = options.page || 1;

  return await db
    .select()
    .from(table)
    .where(where)
    .orderBy(...orderBy)
    .limit(limit)
    .offset(limit * (page - 1));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getObject<Table extends PgTableWithColumns<any>>(options: {
  currentUser?: UserWithRoles;
  role: 'owner';
  table: Table;
  id: string;
  ownershipField?: keyof Table['$inferSelect'];
}): Promise<Table['$inferSelect']>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getObject<Table extends PgTableWithColumns<any>, ParentType>(options: {
  currentUser?: UserWithRoles;
  role: 'parent-owner';
  parent: ParentType;
  table: Table;
  id: string;
  ownershipField?: keyof ParentType;
}): Promise<Table['$inferSelect']>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getObject<Table extends PgTableWithColumns<any>>(options: {
  currentUser?: UserWithRoles;
  role: 'admin' | 'user' | 'public';
  table: Table;
  id: string;
}): Promise<Table['$inferSelect']>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getObject<Table extends PgTableWithColumns<any>, ParentType>(options: {
  currentUser?: UserWithRoles;
  role: 'admin' | 'owner' | 'parent-owner' | 'user' | 'public';
  parent?: ParentType;
  table: Table;
  id: string;
  ownershipField?: keyof Table['$inferSelect'] | keyof ParentType;
}): Promise<Table['$inferSelect']> {
  const {
    currentUser,
    role,
    parent,
    table,
    id,
    ownershipField = 'userId' as keyof Table['$inferSelect']
  } = options;

  if (role !== 'public' && !currentUser) {
    throw new Error('You must be logged in to perform this action');
  }

  if (role === 'admin' && !isAdminSync(currentUser!)) {
    throw new Error('You are not authorized to perform this action');
  }

  if (
    role === 'parent-owner' &&
    (!parent ||
      (parent[ownershipField as keyof ParentType] !== currentUser!.id &&
        !isAdminSync(currentUser!)))
  ) {
    throw new Error('You are not authorized to perform this action');
  }

  const found = (await db
    .select()
    .from(table)
    .where(eq(table.id, id))
    .then((results) => results[0])) as Table['$inferSelect'] | undefined;

  if (!found) {
    throw new Error(`Object with id ${id} not found`);
  }

  if (
    role === 'owner' &&
    (!found[ownershipField as keyof Table['$inferSelect']] ||
      (found[ownershipField as keyof Table['$inferSelect']] !== currentUser!.id &&
        !isAdminSync(currentUser!)))
  ) {
    throw new Error('You are not authorized to perform this action');
  }

  return found;
}

export async function createObject<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Table extends PgTableWithColumns<any>,
  Schema extends z.ZodObject<z.ZodRawShape>
>(options: {
  currentUser?: UserWithRoles;
  role: 'admin' | 'user' | 'public';
  table: Table;
  data: Schema['_input'];
  zodSchema: Schema;
}): Promise<Table['$inferSelect']>;
export async function createObject<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Table extends PgTableWithColumns<any>
>(options: {
  currentUser?: UserWithRoles;
  role: 'admin' | 'user' | 'public';
  table: Table;
  data: Table['$inferInsert'];
}): Promise<Table['$inferSelect']>;

export async function createObject<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Table extends PgTableWithColumns<any>,
  Schema extends z.ZodObject<z.ZodRawShape>
>(options: {
  currentUser?: UserWithRoles;
  role: 'admin' | 'user' | 'public';
  table: Table;
  data: Schema['_input'] | Table['$inferInsert'];
  zodSchema?: Schema;
}): Promise<Table['$inferSelect']> {
  const { currentUser, role, table, zodSchema } = options;
  let { data } = options;

  if (role !== 'public' && !currentUser) {
    throw new Error('You must be logged in to perform this action');
  }

  if (role === 'admin' && !isAdminSync(currentUser!)) {
    throw new Error('You are not authorized to perform this action');
  }

  if (data.userId && data.userId !== currentUser!.id && !isAdminSync(currentUser!)) {
    throw new Error('You are not authorized to perform this action');
  }

  data = {
    ...data,
    userId: table.userId ? data.userId || currentUser!.id : undefined
  };

  let validatedValues: Schema['_output'] | Table['$inferInsert'] = data;
  if (zodSchema) {
    validatedValues = zodSchema.parse(data);
  }

  return (
    await db
      .insert(table)
      .values({
        ...validatedValues,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning()
  ).at(0) as Table['$inferSelect'];
}

export async function updateObject<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Table extends PgTableWithColumns<any>,
  Schema extends z.ZodObject<z.ZodRawShape>
>(options: {
  currentUser?: UserWithRoles;
  role: 'admin' | 'owner' | 'user' | 'public';
  table: Table;
  id: string;
  data: Schema['_input'];
  zodSchema: Schema;
  ownershipField?: keyof Table['$inferSelect'];
}): Promise<Table['$inferSelect']>;
export async function updateObject<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Table extends PgTableWithColumns<any>
>(options: {
  currentUser?: UserWithRoles;
  role: 'admin' | 'owner' | 'user' | 'public';
  table: Table;
  id: string;
  data: PgUpdateSetSource<Table>;
  zodSchema?: undefined;
  ownershipField?: keyof Table['$inferSelect'];
}): Promise<Table['$inferSelect']>;

export async function updateObject<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Table extends PgTableWithColumns<any>,
  Schema extends z.ZodObject<z.ZodRawShape>
>(options: {
  currentUser?: UserWithRoles;
  role: 'admin' | 'owner' | 'user' | 'public';
  table: Table;
  id: string;
  data: Schema['_input'] | PgUpdateSetSource<Table>;
  zodSchema?: Schema;
  ownershipField?: keyof Table['$inferSelect'];
}): Promise<Table['$inferSelect']> {
  const { currentUser, role, table, id, data, zodSchema, ownershipField = 'userId' } = options;

  if (role !== 'public' && !currentUser) {
    throw new Error('You must be logged in to perform this action');
  }

  if (role === 'admin' && !isAdminSync(currentUser!)) {
    throw new Error('You are not authorized to perform this action');
  }

  const found = (await db
    .select()
    .from(table)
    .where(eq(table.id, id))
    .then((results) => results[0])) as Table['$inferSelect'] | undefined;

  if (!found) {
    throw new Error(`Object with id ${id} not found`);
  }

  if (
    role === 'owner' &&
    (!found[ownershipField] ||
      (found[ownershipField] !== currentUser!.id && !isAdminSync(currentUser!)))
  ) {
    throw new Error('You are not authorized to perform this action');
  }

  let values = data;
  if (zodSchema) {
    values = zodSchema.parse(data);
  }

  return (
    await db
      .update(table)
      .set({
        ...values,
        createdAt: undefined,
        updatedAt: new Date()
      })
      .where(eq(table.id, id))
      .returning()
  ).at(0) as Table['$inferSelect'];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function deleteObject<Table extends PgTableWithColumns<any>>(options: {
  currentUser?: UserWithRoles;
  role: 'owner';
  table: Table;
  id: string;
  ownershipField?: keyof Table['$inferSelect'];
}): Promise<Table['$inferSelect']>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function deleteObject<Table extends PgTableWithColumns<any>>(options: {
  currentUser?: UserWithRoles;
  role: 'admin' | 'user' | 'public';
  table: Table;
  id: string;
}): Promise<Table['$inferSelect']>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function deleteObject<Table extends PgTableWithColumns<any>>(options: {
  currentUser?: UserWithRoles;
  role: 'admin' | 'owner' | 'user' | 'public';
  table: Table;
  id: string;
  ownershipField?: keyof Table['$inferSelect'];
}): Promise<Table['$inferSelect']> {
  const { currentUser, role, table, id, ownershipField = 'userId' } = options;

  if (role !== 'public' && !currentUser) {
    throw new Error('You must be logged in to perform this action');
  }

  if (role === 'admin' && !isAdminSync(currentUser!)) {
    throw new Error('You are not authorized to perform this action');
  }

  const found = (await db
    .select()
    .from(table)
    .where(eq(table.id, id))
    .then((results) => results[0])) as Table['$inferSelect'] | undefined;

  if (!found) {
    throw new Error(`Object with id ${id} not found`);
  }

  if (
    role === 'owner' &&
    (!found[ownershipField] ||
      (found[ownershipField] !== currentUser!.id && !isAdminSync(currentUser!)))
  ) {
    throw new Error('You are not authorized to perform this action');
  }

  return (await db.delete(table).where(eq(table.id, id)).returning()).at(
    0
  ) as Table['$inferSelect'];
}
