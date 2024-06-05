import { Bible, Book, Chapter } from '@theaistudybible/core/model/bible';
import { H2 } from '../../ui/typography';
import '../contents/contents.css';
import ReaderContent from '../reader-content';

export type ChapterContentProps = {
  bible: Bible;
  book: Book;
  chapter: Chapter;
};

export default function ChapterContent({ bible, book, chapter }: ChapterContentProps) {
  return (
    <>
      <H2 class="text-center">{chapter.name}</H2>
      <ReaderContent bible={bible} book={book} chapter={chapter} contents={chapter.content} />
    </>
  );
}
