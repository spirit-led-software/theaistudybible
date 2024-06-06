import { Bible, Book, Chapter } from '@theaistudybible/core/model/bible';
import { H2 } from '../../ui/typography';
import '../contents/contents.css';
import ReaderContent from '../reader-content';

export type ChapterContentProps = {
  bible: Bible;
  book: Book;
  chapter: Chapter;
};

export default function ChapterContent(props: ChapterContentProps) {
  return (
    <>
      <H2 class="text-center">{props.chapter.name}</H2>
      <ReaderContent
        bible={props.bible}
        book={props.book}
        chapter={props.chapter}
        contents={props.chapter.content}
      />
    </>
  );
}
