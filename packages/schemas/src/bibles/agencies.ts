import { bibleContributors, bibleRightsAdmins, bibleRightsHolders } from '@/core/database/schema';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { defaultRefine } from '../utils/refine';

export const BibleRightsHolderSchema = createSelectSchema(bibleRightsHolders, defaultRefine);

export const CreateBibleRightsHolderSchema = createInsertSchema(
  bibleRightsHolders,
  defaultRefine,
).omit({
  createdAt: true,
  updatedAt: true,
});

export const UpdateBibleRightsHolderSchema = CreateBibleRightsHolderSchema.omit({
  uid: true,
}).partial();

export const BibleRightsAdminSchema = createSelectSchema(bibleRightsAdmins, defaultRefine);

export const CreateBibleRightsAdminSchema = createInsertSchema(
  bibleRightsAdmins,
  defaultRefine,
).omit({
  createdAt: true,
  updatedAt: true,
});

export const UpdateBibleRightsAdminSchema = CreateBibleRightsAdminSchema.omit({
  uid: true,
}).partial();

export const BibleContributorSchema = createSelectSchema(bibleContributors, defaultRefine);

export const CreateBibleContributorSchema = createInsertSchema(
  bibleContributors,
  defaultRefine,
).omit({
  createdAt: true,
  updatedAt: true,
});

export const UpdateBibleContributorSchema = CreateBibleContributorSchema.omit({
  uid: true,
}).partial();
