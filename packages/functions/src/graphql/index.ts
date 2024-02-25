import { ApolloServer } from '@apollo/server';
import { handlers, startServerAndCreateLambdaHandler } from '@as-integrations/aws-lambda';
import { buildOrderBy, buildWhere } from '@revelationsai/core/database/helpers';
import { roles, usersToRoles } from '@revelationsai/core/database/schema';
import type { UserWithRoles } from '@revelationsai/core/model/user';
import { db } from '@revelationsai/server/lib/database';
import { getChatsByUserId } from '@revelationsai/server/services/chat';
import { validApiHandlerSession } from '@revelationsai/server/services/session';
import { isAdminSync } from '@revelationsai/server/services/user';
import { getUserPasswordByUserId } from '@revelationsai/server/services/user/password';
import { and, eq } from 'drizzle-orm';
import { readFileSync } from 'fs';
import { GraphQLScalarType, Kind } from 'graphql';
import type { Resolvers } from './__generated__/resolver-types';

export interface Context {
  currentUser: UserWithRoles | undefined;
}

const dateScalar = new GraphQLScalarType({
  name: 'Date',
  description: 'Date custom scalar type',
  serialize(value) {
    if (value instanceof Date) {
      return value.getTime(); // Convert outgoing Date to integer for JSON
    }
    throw Error('GraphQL Date Scalar serializer expected a `Date` object');
  },
  parseValue(value) {
    if (typeof value === 'number') {
      return new Date(value); // Convert incoming integer to Date
    } else if (typeof value === 'string') {
      return new Date(value); // Convert incoming string to Date
    }
    throw new Error('GraphQL Date Scalar parser expected a `number` or `string`');
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.INT) {
      // Convert hard-coded AST string to integer and then to Date
      return new Date(parseInt(ast.value, 10));
    } else if (ast.kind === Kind.STRING) {
      // Convert hard-coded AST string to Date
      return new Date(ast.value);
    }
    // Invalid hard-coded value (not an integer)
    return null;
  }
});

const typeDefs = readFileSync('graphql/schema.graphql', 'utf-8');

const resolvers: Resolvers = {
  Date: dateScalar,
  User: {
    password: (parent, _, { currentUser }) => {
      if (!currentUser || (currentUser.id !== parent.id && !isAdminSync(currentUser))) {
        throw new Error("You are not authorized to view this user's password");
      }
      return getUserPasswordByUserId(parent.id);
    },
    roles: (
      parent,
      { filter, limit = 25, page = 1, sort = { field: 'createdAt', order: 'desc' } },
      { currentUser }
    ) => {
      if (!currentUser || currentUser.id !== parent.id) {
        throw new Error("You are not authorized to view this user's roles");
      }
      const where = filter
        ? and(eq(usersToRoles.userId, parent.id), buildWhere(roles, filter))
        : eq(usersToRoles.userId, parent.id);
      return db
        .select()
        .from(usersToRoles)
        .where(where)
        .innerJoin(roles, eq(usersToRoles.roleId, roles.id))
        .limit(limit!)
        .offset((page! - 1) * limit!)
        .orderBy(buildOrderBy(roles, sort!.field, sort!.order))
        .then((results) => results.map((result) => result.roles));
    },
    chats: (parent) => getChatsByUserId(parent.id)
  },
  Query: {}
};

const server = new ApolloServer<Context>({
  typeDefs,
  resolvers
});

export const handler = startServerAndCreateLambdaHandler(
  server,
  handlers.createAPIGatewayProxyEventV2RequestHandler(),
  {
    context: async () => {
      const { userWithRoles } = await validApiHandlerSession();
      return {
        currentUser: userWithRoles
      };
    }
  }
);
