import type { TextContent } from '@/schemas/bibles/contents';
import { useBibleReaderStore } from '@/www/contexts/bible-reader';
import { cn } from '@/www/lib/utils';
import { A } from '@solidjs/router';
import { createMemo } from 'solid-js';

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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const [bookAbbr, chapterAndVerse] = props.attrs.loc.split(' ');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
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
