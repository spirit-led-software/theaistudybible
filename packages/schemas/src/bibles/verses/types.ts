import type { z } from 'zod';
import type { CreateVerseSchema, UpdateVerseSchema, VerseSchema } from '.';
import type { CreateVerseNoteSchema, UpdateVerseNoteSchema, VerseNoteSchema } from './notes';

export type Verse = z.infer<typeof VerseSchema>;
export type CreateVerse = z.infer<typeof CreateVerseSchema>;
export type UpdateVerse = z.infer<typeof UpdateVerseSchema>;

export type VerseNote = z.infer<typeof VerseNoteSchema>;
export type CreateVerseNote = z.infer<typeof CreateVerseNoteSchema>;
export type UpdateVerseNote = z.infer<typeof UpdateVerseNoteSchema>;
