import { userGeneratedImages, users } from '@revelationsai/core/database/schema';
import { getSourceDocumentsByUserGeneratedImageId } from '@revelationsai/server/services/source-document';
import { isAdminSync, isObjectOwner } from '@revelationsai/server/services/user';
import type { Resolvers } from '../../__generated__/resolver-types';
import { deleteObject, getObject, getObjects } from '../../utils/crud';

export const userGeneratedImageResolvers: Resolvers = {
  UserGeneratedImage: {
    user: async (parent, __, { currentUser }) => {
      return await getObject({
        currentUser,
        role: 'parent-owner',
        parent,
        table: users,
        id: parent.userId
      });
    },
    sourceDocuments: async (parent, _, { currentUser }) => {
      if (!currentUser || (!isObjectOwner(parent, currentUser.id) && !isAdminSync(currentUser))) {
        throw new Error("You are not authorized to view this AI response's source documents");
      }
      return await getSourceDocumentsByUserGeneratedImageId(parent.id);
    }
  },
  Query: {
    userGeneratedImage: async (_, { id }, { currentUser }) => {
      return await getObject({
        currentUser,
        role: 'owner',
        table: userGeneratedImages,
        id
      });
    },
    userGeneratedImages: async (_, args, { currentUser }) => {
      return await getObjects({
        currentUser,
        role: 'owner',
        table: userGeneratedImages,
        ...args
      });
    }
  },
  Mutation: {
    deleteUserGeneratedImage: async (_, { id }, { currentUser }) => {
      return await deleteObject({
        currentUser,
        role: 'owner',
        table: userGeneratedImages,
        id
      });
    }
  }
};
