import { bibleCountries } from '@/core/database/schema';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { defaultRefine } from '../utils/refine';

export const BibleCountrySchema = createSelectSchema(bibleCountries, defaultRefine);

export const CreateBibleCountrySchema = createInsertSchema(bibleCountries, defaultRefine).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateBibleCountrySchema = CreateBibleCountrySchema.partial();
