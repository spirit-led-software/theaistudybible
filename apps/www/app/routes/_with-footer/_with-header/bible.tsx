import { LargeTranslationPicker } from '@/www/components/bible/reader/menu/translation-picker/large';
import { useBibleStore } from '@/www/contexts/bible';
import { Navigate, createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_with-footer/_with-header/bible')({
  head: () => {
    const title = 'Pick Your Bible Translation | The AI Study Bible - Access Scripture Anywhere';
    const description =
      'Choose from multiple Bible translations to start your personalized Scripture study experience. Access AI-powered insights, study tools, and in-depth analysis with The AI Study Bible.';
    return {
      meta: [
        { title },
        { name: 'description', content: description },
        { name: 'og:title', content: title },
        { name: 'og:description', content: description },
        { name: 'twitter:card', content: 'summary' },
        { name: 'twitter:title', content: title },
        { name: 'twitter:description', content: description },
      ],
    };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { bible, book, chapter, verse } = useBibleStore((state) => ({
    bible: state.bible,
    book: state.book,
    chapter: state.chapter,
    verse: state.verse,
  }));
  if (bible && book && chapter) {
    return (
      <Navigate
        to={
          verse
            ? '/bible/$bibleAbbreviation/$bookCode/$chapterNumber/$verseNumber'
            : '/bible/$bibleAbbreviation/$bookCode/$chapterNumber'
        }
        params={{
          bibleAbbreviation: bible.abbreviation,
          bookCode: book.code,
          chapterNumber: chapter.number,
          verseNumber: verse?.number,
        }}
      />
    );
  }

  return (
    <div className='flex w-full flex-col p-5 text-center'>
      <LargeTranslationPicker />
    </div>
  );
}
