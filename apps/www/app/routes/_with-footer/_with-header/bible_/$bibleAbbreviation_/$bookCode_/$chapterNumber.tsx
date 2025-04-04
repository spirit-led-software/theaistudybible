import { ChapterReader } from '@/www/components/bible/chapter/reader';
import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

export const Route = createFileRoute(
  '/_with-footer/_with-header/bible_/$bibleAbbreviation_/$bookCode_/$chapterNumber',
)({
  params: z.object({
    bibleAbbreviation: z.string(),
    bookCode: z.string(),
    chapterNumber: z
      .string()
      .or(z.number())
      .transform((val) => Number(val)),
  }),
  validateSearch: z.object({
    verseNumbers: z
      .string()
      .or(z.number())
      .transform((val) => Number(val))
      .array()
      .optional(),
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const { bibleAbbreviation, bookCode, chapterNumber } = Route.useParams();
  return (
    <div className='mx-auto flex h-full w-full max-w-3xl flex-1'>
      <ChapterReader
        bibleAbbreviation={bibleAbbreviation}
        bookCode={bookCode}
        chapterNumber={chapterNumber}
      />
    </div>
  );
}
