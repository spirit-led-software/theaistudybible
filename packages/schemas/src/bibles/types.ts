import type { z } from 'zod';
import type { BibleSchema, CreateBibleSchema, UpdateBibleSchema } from '.';
import type {
  BibleContributorSchema,
  BibleRightsAdminSchema,
  BibleRightsHolderSchema,
  CreateBibleContributorSchema,
  CreateBibleRightsAdminSchema,
  CreateBibleRightsHolderSchema,
  UpdateBibleContributorSchema,
  UpdateBibleRightsAdminSchema,
  UpdateBibleRightsHolderSchema,
} from './agencies';
import type { BookSchema, CreateBookSchema, UpdateBookSchema } from './books';
import type {
  BibleCountrySchema,
  CreateBibleCountrySchema,
  UpdateBibleCountrySchema,
} from './countries';
import type {
  BibleLanguageSchema,
  CreateBibleLanguageSchema,
  UpdateBibleLanguageSchema,
} from './languages';

export type Bible = z.infer<typeof BibleSchema>;
export type CreateBible = z.infer<typeof CreateBibleSchema>;
export type UpdateBible = z.infer<typeof UpdateBibleSchema>;

export type Book = z.infer<typeof BookSchema>;
export type CreateBook = z.infer<typeof CreateBookSchema>;
export type UpdateBook = z.infer<typeof UpdateBookSchema>;

export type BibleLanguage = z.infer<typeof BibleLanguageSchema>;
export type CreateBibleLanguage = z.infer<typeof CreateBibleLanguageSchema>;
export type UpdateBibleLanguage = z.infer<typeof UpdateBibleLanguageSchema>;

export type BibleCountry = z.infer<typeof BibleCountrySchema>;
export type CreateBibleCountry = z.infer<typeof CreateBibleCountrySchema>;
export type UpdateBibleCountry = z.infer<typeof UpdateBibleCountrySchema>;

export type BibleRightsHolder = z.infer<typeof BibleRightsHolderSchema>;
export type CreateBibleRightsHolder = z.infer<typeof CreateBibleRightsHolderSchema>;
export type UpdateBibleRightsHolder = z.infer<typeof UpdateBibleRightsHolderSchema>;

export type BibleRightsAdmin = z.infer<typeof BibleRightsAdminSchema>;
export type CreateBibleRightsAdmin = z.infer<typeof CreateBibleRightsAdminSchema>;
export type UpdateBibleRightsAdmin = z.infer<typeof UpdateBibleRightsAdminSchema>;

export type BibleContributor = z.infer<typeof BibleContributorSchema>;
export type CreateBibleContributor = z.infer<typeof CreateBibleContributorSchema>;
export type UpdateBibleContributor = z.infer<typeof UpdateBibleContributorSchema>;

export * from './chapters/types';
export * from './verses/types';
