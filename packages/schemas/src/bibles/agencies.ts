import { bibleContributors, bibleRightsAdmins, bibleRightsHolders } from '@/core/database/schema';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { defaultRefine } from '../utils/refine';

export const BibleRightsHolderSchema = createSelectSchema(bibleRightsHolders, defaultRefine);

export const CreateBibleRightsHolderSchema = createInsertSchema(
  bibleRightsHolders,
  defaultRefine,
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateBibleRightsHolderSchema = CreateBibleRightsHolderSchema.partial();

export const BibleRightsAdminSchema = createSelectSchema(bibleRightsAdmins, defaultRefine);

export const CreateBibleRightsAdminSchema = createInsertSchema(
  bibleRightsAdmins,
  defaultRefine,
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateBibleRightsAdminSchema = CreateBibleRightsAdminSchema.partial();

export const BibleContributorSchema = createSelectSchema(bibleContributors, defaultRefine);

export const CreateBibleContributorSchema = createInsertSchema(
  bibleContributors,
  defaultRefine,
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateBibleContributorSchema = CreateBibleContributorSchema.partial();
