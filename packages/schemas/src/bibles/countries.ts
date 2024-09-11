import { bibleCountries } from '@/core/database/schema';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const BibleCountrySchema = createSelectSchema(bibleCountries);

export const CreateBibleCountrySchema = createInsertSchema(bibleCountries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateBibleCountrySchema = CreateBibleCountrySchema.partial();
