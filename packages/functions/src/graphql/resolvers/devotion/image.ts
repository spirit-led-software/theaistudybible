import { devotionImages, devotions } from '@revelationsai/core/database/schema';
import { updateDevotionImageSchema } from '@revelationsai/core/model/devotion/image';
import type { Resolvers } from '../../__generated__/resolver-types';
import { deleteObject, getObject, getObjects, updateObject } from '../../utils/crud';

export const devotionImageResolvers: Resolvers = {
  DevotionImage: {
    devotion: async (parent, __, { currentUser }) => {
      return await getObject({
        currentUser,
        role: 'public',
        table: devotions,
        id: parent.devotionId
      });
    }
  },
  Query: {
    devotionImage: async (_, { id }, { currentUser }) => {
      return await getObject({
        currentUser,
        role: 'public',
        table: devotionImages,
        id
      });
    },
    devotionImages: async (_, args, { currentUser }) => {
      return await getObjects({
        currentUser,
        role: 'public',
        table: devotionImages,
        ...args
      });
    }
  },
  Mutation: {
    updateDevotionImage: async (_, { id, input }, { currentUser }) => {
      return await updateObject({
        currentUser,
        role: 'admin',
        table: devotionImages,
        id,
        data: input,
        zodSchema: updateDevotionImageSchema
      });
    },
    deleteDevotionImage: async (_, { id }, { currentUser }) => {
      return await deleteObject({
        currentUser,
        role: 'admin',
        table: devotionImages,
        id
      });
    }
  }
};
