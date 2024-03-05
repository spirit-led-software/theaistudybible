import { ApolloServer } from '@apollo/server';
import responseCachePlugin from '@apollo/server-plugin-response-cache';
import { KeyvAdapter } from '@apollo/utils.keyvadapter';
import { ErrorsAreMissesCache } from '@apollo/utils.keyvaluecache';
import { handlers, startServerAndCreateLambdaHandler } from '@as-integrations/aws-lambda';
import { ApolloArmor } from '@escape.tech/graphql-armor';
import type { UserWithRoles } from '@revelationsai/core/model/user';
import { validNonApiHandlerSession } from '@revelationsai/server/services/session';
import { readFileSync } from 'fs';
import { GraphQLScalarType, Kind } from 'graphql';
import Keyv from 'keyv';
import { Config } from 'sst/node/config';
import type { Resolvers } from './__generated__/resolver-types';
import { aiResponseResolvers } from './resolvers/ai-response';
import { aiResponseReactionResolvers } from './resolvers/ai-response/reaction';
import { chatResolvers } from './resolvers/chat';
import { devotionResolvers } from './resolvers/devotion';
import { devotionImageResolvers } from './resolvers/devotion/image';
import { devotionReactionResolvers } from './resolvers/devotion/reaction';
import { rolesResolvers as roleResolvers } from './resolvers/role';
import { userResolvers } from './resolvers/user';
import { userMessagesResolvers as userMessageResolvers } from './resolvers/user/message';
import { userPasswordResolvers } from './resolvers/user/password';

export interface Context {
  currentUser: UserWithRoles | undefined;
}

const dateScalar = new GraphQLScalarType({
  name: 'Date',
  description: 'Date custom scalar type',
  serialize(value) {
    if (value instanceof Date) {
      return value.toISOString(); // Convert outgoing Date to integer for JSON
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

const metadataScalar = new GraphQLScalarType({
  name: 'Metadata',
  description: 'Metadata custom scalar type',
  serialize(value) {
    if (typeof value === 'object') {
      return JSON.stringify(value); // Convert outgoing object to JSON string
    }
    throw Error('GraphQL Date Scalar serializer expected an object');
  },
  parseValue(value) {
    if (typeof value === 'string') {
      return JSON.parse(value); // Convert incoming string to object
    }
    throw new Error('GraphQL Date Scalar parser expected a `string`');
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      return JSON.parse(ast.value); // Convert hard-coded AST string to object
    }
    // Invalid hard-coded value
    return null;
  }
});

const typeDefs = readFileSync('graphql/schema.graphql', 'utf-8');
const resolvers: Resolvers = {
  Date: dateScalar,
  Metadata: metadataScalar
};

const armor = new ApolloArmor({
  maxDepth: {
    enabled: true,
    n: 10
  }
});
const protection = armor.protect();

const server = new ApolloServer<Context>({
  typeDefs,
  resolvers: [
    resolvers,
    userResolvers,
    userPasswordResolvers,
    roleResolvers,
    chatResolvers,
    userMessageResolvers,
    aiResponseResolvers,
    aiResponseReactionResolvers,
    devotionResolvers,
    devotionImageResolvers,
    devotionReactionResolvers
  ],
  cache: Config.UPSTASH_REDIS_URL
    ? new ErrorsAreMissesCache(new KeyvAdapter(new Keyv(Config.UPSTASH_REDIS_URL)))
    : undefined,
  ...protection,
  plugins: [
    ...protection.plugins,
    responseCachePlugin({
      sessionId: async (requestContext) =>
        requestContext.request.http?.headers.get('authorization') || null
    })
  ],
  validationRules: [...protection.validationRules]
});

export const handler = startServerAndCreateLambdaHandler(
  server,
  handlers.createAPIGatewayProxyEventV2RequestHandler(),
  {
    context: async ({ event }) => {
      const { userWithRoles } = await validNonApiHandlerSession(
        event.headers.authorization?.split(' ')[1]
      );
      return {
        currentUser: userWithRoles
      };
    }
  }
);
