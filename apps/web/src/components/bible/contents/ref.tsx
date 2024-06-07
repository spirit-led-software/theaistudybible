import { A } from '@solidjs/router';
import { Bible } from '@theaistudybible/core/model/bible';
import type { TextContent } from '@theaistudybible/core/types/bible';
import { cn } from '~/lib/utils';

export type RefContentProps = {
  content: TextContent;
  style: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  attrs: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  props: any;
  class?: string;
  bible: Bible;
};

export default function RefContent(props: RefContentProps) {
  const { loc } = props.attrs;
  const [bookAbbr, chapterAndVerse] = loc.split(' ');
  const [chapter, verse] = chapterAndVerse.split(':');
  let link = `/bible/${props.bible.abbreviation}/${bookAbbr}/${chapter}`;
  if (verse) {
    link += `/${verse}`;
  }
  return (
    <A
      id={props.content.id}
      data-type={props.content.type}
      data-verse-id={props.content.verseId}
      data-verse-number={props.content.verseNumber}
      {...props}
      class={cn(props.style, `hover:underline`, props.class)}
      href={link}
    >
      {props.content.text}
    </A>
  );
}
