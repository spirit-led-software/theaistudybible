import type { TextContent } from '@/schemas/bibles/contents';
import { useBibleReaderStore } from '@/www/contexts/bible-reader';
import { cn } from '@/www/lib/utils';
import { A } from '@solidjs/router';
import { createMemo } from 'solid-js';

export type RefContentProps = {
  content: TextContent;
  style: string;
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  attrs: any;
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  props: any;
  class?: string;
};

export function RefContent(props: RefContentProps) {
  const [brStore] = useBibleReaderStore();

  const link = createMemo(() => {
    const [bookCode, chapterAndVerse] = props.attrs.loc.split(' ');

    const [chapter, verse] = chapterAndVerse.split(':');
    let link = `/bible/${brStore.bible.abbreviation}/${bookCode}/${chapter}`;
    if (verse) {
      link += `/${verse}`;
    }
    return link;
  });

  return (
    <A
      id={props.content.id}
      data-type={props.content.type}
      data-verse-code={props.content.verseCode}
      data-verse-number={props.content.verseNumber}
      {...props.props}
      class={cn(props.style, 'hover:underline', props.class)}
      href={link()}
    >
      {props.content.text}
    </A>
  );
}
