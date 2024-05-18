import { devotionImages, devotionReactions, devotions } from '@revelationsai/core/database/schema';
import { updateDevotionSchema } from '@revelationsai/core/model/devotion';
import { getSourceDocumentsByDevotionId } from '@revelationsai/server/services/source-document';
import { and, eq } from 'drizzle-orm';
import type { Resolvers } from '../__generated__/resolver-types';
import { deleteObject, getObject, getObjectCount, getObjects, updateObject } from '../utils/crud';

export const devotionResolvers: Resolvers = {
  Devotion: {
    images: async (parent, args, { currentUser }) => {
      return await getObjects({
        currentUser,
        role: 'public',
        table: devotionImages,
        where: eq(devotionImages.devotionId, parent.id),
        ...args
      });
    },
    reactions: async (parent, args, { currentUser }) => {
      return await getObjects({
        currentUser,
        role: 'public',
        table: devotionReactions,
        where: eq(devotionReactions.devotionId, parent.id),
        ...args
      });
    },
    reactionCounts: async (parent, _, { currentUser }) => {
      const [likeCount, dislikeCount] = await Promise.all([
        getObjectCount({
          currentUser,
          role: 'public',
          table: devotionReactions,
          where: and(
            eq(devotionReactions.devotionId, parent.id),
            eq(devotionReactions.reaction, 'LIKE')
          )
        }),
        getObjectCount({
          currentUser,
          role: 'public',
          table: devotionReactions,
          where: and(
            eq(devotionReactions.devotionId, parent.id),
            eq(devotionReactions.reaction, 'DISLIKE')
          )
        })
      ]);
      return [
        {
          type: 'LIKE',
          count: likeCount
        },
        {
          type: 'DISLIKE',
          count: dislikeCount
        }
      ];
    },
    sourceDocuments: async (parent) => {
      return await getSourceDocumentsByDevotionId(parent.id);
    }
  },
  Query: {
    devotion: async (_, { id }, { currentUser }) => {
      return await getObject({
        currentUser,
        role: 'public',
        table: devotions,
        id
      });
    },
    devotions: async (_, args, { currentUser }) => {
      return await getObjects({
        currentUser,
        role: 'public',
        table: devotions,
        ...args
      });
    }
  },
  Mutation: {
    updateDevotion: async (_, { id, input }, { currentUser }) => {
      return await updateObject({
        currentUser,
        role: 'admin',
        table: devotions,
        id,
        data: input,
        zodSchema: updateDevotionSchema
      });
    },
    deleteDevotion: async (_, { id }, { currentUser }) => {
      return await deleteObject({
        currentUser,
        role: 'admin',
        table: devotions,
        id
      });
    }
  }
};
