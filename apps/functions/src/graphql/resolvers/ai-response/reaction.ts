import { aiResponseReactions, aiResponses, users } from '@revelationsai/core/database/schema';
import {
  createAiResponseReactionSchema,
  updateAiResponseReactionSchema
} from '@revelationsai/core/model/ai-response/reaction';
import { type Resolvers } from '../../__generated__/resolver-types';
import { createObject, deleteObject, getObject, getObjects, updateObject } from '../../utils/crud';

export const aiResponseReactionResolvers: Resolvers = {
  AiResponseReaction: {
    user: async (parent, _, { currentUser }) => {
      return await getObject({
        currentUser,
        role: 'parent-owner',
        parent,
        table: users,
        id: parent.userId
      });
    },
    aiResponse: async (parent, _, { currentUser }) => {
      return await getObject({
        currentUser,
        role: 'parent-owner',
        parent,
        table: aiResponses,
        id: parent.aiResponseId
      });
    }
  },
  Query: {
    aiResponseReaction: async (_, { id }, { currentUser }) => {
      return await getObject({
        currentUser,
        role: 'owner',
        table: aiResponseReactions,
        id
      });
    },
    aiResponseReactions: async (_, args, { currentUser }) => {
      return await getObjects({
        currentUser,
        role: 'owner',
        table: aiResponseReactions,
        ...args
      });
    }
  },
  Mutation: {
    createAiResponseReaction: async (_, { input }, { currentUser }) => {
      return await createObject({
        currentUser,
        role: 'user',
        table: aiResponseReactions,
        data: {
          ...input,
          userId: input.userId || currentUser!.id
        },
        zodSchema: createAiResponseReactionSchema
      });
    },
    updateAiResponseReaction: async (_, { id, input }, { currentUser }) => {
      return await updateObject({
        currentUser,
        role: 'owner',
        table: aiResponseReactions,
        id,
        data: input,
        zodSchema: updateAiResponseReactionSchema
      });
    },
    deleteAiResponseReaction: async (_, { id }, { currentUser }) => {
      return await deleteObject({
        currentUser,
        role: 'owner',
        table: aiResponseReactions,
        id
      });
    }
  }
};
