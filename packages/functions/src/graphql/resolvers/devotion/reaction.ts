import { devotionReactions, devotions, users } from '@revelationsai/core/database/schema';
import {
  createDevotionReactionSchema,
  updateDevotionReactionSchema
} from '@revelationsai/core/model/devotion/reaction';
import type { Resolvers } from '../../__generated__/resolver-types';
import { createObject, deleteObject, getObject, getObjects, updateObject } from '../../utils/crud';

export const devotionReactionResolvers: Resolvers = {
  DevotionReaction: {
    devotion: async (parent, __, { currentUser }) => {
      return await getObject({
        currentUser,
        role: 'public',
        table: devotions,
        id: parent.devotionId
      });
    },
    user: async (parent, __, { currentUser }) => {
      return await getObject({
        currentUser,
        role: 'public',
        table: users,
        id: parent.userId
      });
    }
  },
  Query: {
    devotionReaction: async (_, { id }, { currentUser }) => {
      return await getObject({
        currentUser,
        role: 'public',
        table: devotionReactions,
        id
      });
    },
    devotionReactions: async (_, args, { currentUser }) => {
      return await getObjects({
        currentUser,
        role: 'public',
        table: devotionReactions,
        ...args
      });
    }
  },
  Mutation: {
    createDevotionReaction: async (_, { input }, { currentUser }) => {
      return await createObject({
        currentUser,
        role: 'user',
        table: devotionReactions,
        data: {
          ...input,
          userId: input.userId || currentUser!.id
        },
        zodSchema: createDevotionReactionSchema
      });
    },
    updateDevotionReaction: async (_, { id, input }, { currentUser }) => {
      return await updateObject({
        currentUser,
        role: 'owner',
        table: devotionReactions,
        id,
        data: input,
        zodSchema: updateDevotionReactionSchema
      });
    },
    deleteDevotionReaction: async (_, { id }, { currentUser }) => {
      return await deleteObject({
        currentUser,
        role: 'owner',
        table: devotionReactions,
        id
      });
    }
  }
};
