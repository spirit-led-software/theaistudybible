import { A } from '@solidjs/router';
import type { TextContent } from '@theaistudybible/core/types/bible';
import type { InferResponseType } from 'hono/client';
import { cn } from '~/lib/utils';
import type { RpcClient } from '~/types/rpc';

export default function RefContent({
  content,
  style,
  attrs,
  props,
  class: className,
  bible
}: {
  content: TextContent;
  style: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  attrs: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  props: any;
  class?: string;
  bible: InferResponseType<RpcClient['bibles'][':id']['$get']>['data'];
}) {
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
      className={cn(style, `hover:underline`, className)}
      href={link}
    >
      {content.text}
    </A>
  );
}
