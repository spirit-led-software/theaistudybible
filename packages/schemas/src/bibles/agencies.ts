import { bibleContributors, bibleRightsAdmins, bibleRightsHolders } from '@/core/database/schema';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const BibleRightsHolderSchema = createSelectSchema(bibleRightsHolders);

export const CreateBibleRightsHolderSchema = createInsertSchema(bibleRightsHolders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateBibleRightsHolderSchema = CreateBibleRightsHolderSchema.partial();

export const BibleRightsAdminSchema = createSelectSchema(bibleRightsAdmins);

export const CreateBibleRightsAdminSchema = createInsertSchema(bibleRightsAdmins).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateBibleRightsAdminSchema = CreateBibleRightsAdminSchema.partial();

export const BibleContributorSchema = createSelectSchema(bibleContributors);

export const CreateBibleContributorSchema = createInsertSchema(bibleContributors).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateBibleContributorSchema = CreateBibleContributorSchema.partial();
