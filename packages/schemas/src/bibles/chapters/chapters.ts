import { chapters } from '@/core/database/schema';
import { defaultRefine } from '@/schemas/utils/default-refine';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { ContentSchema } from '../contents';

const refine = {
  ...defaultRefine,
  content: ContentSchema.array(),
};

export const ChapterSchema = createSelectSchema(chapters, refine);

export const CreateChapterSchema = createInsertSchema(chapters, refine).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateChapterSchema = CreateChapterSchema.partial().omit({
  bibleId: true,
  bookId: true,
  previousId: true,
  nextId: true,
});
