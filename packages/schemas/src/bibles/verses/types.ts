import type { z } from 'zod';
import type { CreateVerseNoteSchema, UpdateVerseNoteSchema, VerseNoteSchema } from './notes';

export type VerseNote = z.infer<typeof VerseNoteSchema>;
export type CreateVerseNote = z.infer<typeof CreateVerseNoteSchema>;
export type UpdateVerseNote = z.infer<typeof UpdateVerseNoteSchema>;
