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

export default function RefContent({
  content,
  style,
  attrs,
  props,
  class: className,
  bible
}: RefContentProps) {
  const { loc } = attrs;
  const [bookAbbr, chapterAndVerse] = loc.split(' ');
  const [chapter, verse] = chapterAndVerse.split(':');
  let link = `/bible/${bible.abbreviation}/${bookAbbr}/${chapter}`;
  if (verse) {
    link += `/${verse}`;
  }
  return (
    <A
      id={content.id}
      data-type={content.type}
      data-verse-id={content.verseId}
      data-verse-number={content.verseNumber}
      {...props}
      class={cn(style, `hover:underline`, className)}
      href={link}
    >
      {content.text}
    </A>
  );
}
