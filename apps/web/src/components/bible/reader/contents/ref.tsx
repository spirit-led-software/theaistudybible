import { A } from '@solidjs/router';
import type { TextContent } from '@theaistudybible/core/types/bible';
import { createMemo } from 'solid-js';
import { useBibleReaderStore } from '~/components/providers/bible-reader';
import { cn } from '~/lib/utils';

export type RefContentProps = {
  content: TextContent;
  style: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  attrs: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  props: any;
  class?: string;
};

export default function RefContent(props: RefContentProps) {
  const [brStore] = useBibleReaderStore();

  const link = createMemo(() => {
    const [bookAbbr, chapterAndVerse] = props.attrs.loc.split(' ');
    const [chapter, verse] = chapterAndVerse.split(':');
    let link = `/bible/${brStore.bible.abbreviation}/${bookAbbr}/${chapter}`;
    if (verse) {
      link += `/${verse}`;
    }
    return link;
  });

  return (
    <A
      id={props.content.id}
      data-type={props.content.type}
      data-verse-id={props.content.verseId}
      data-verse-number={props.content.verseNumber}
      {...props}
      class={cn(props.style, `hover:underline`, props.class)}
      href={link()}
    >
      {props.content.text}
    </A>
  );
}
