import { cn } from '@/lib/utils';
import type { Routes } from '@/types/rpc';
import type { TextContent } from '@core/types/bible';
import type { InferResponseType } from 'hono/client';
import Link from 'next/link';

export default function RefContent({
  content,
  style,
  attrs,
  props,
  className,
  bible
}: {
  content: TextContent;
  style: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  attrs: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  props: any;
  className?: string;
  bible: InferResponseType<Routes['bibles'][':id']['$get']>['data'];
}) {
  const { loc } = attrs;
  const [bookAbbr, chapterAndVerse] = loc.split(' ');
  const [chapter, verse] = chapterAndVerse.split(':');
  let link = `/bible/${bible.abbreviation}/${bookAbbr}/${chapter}`;
  if (verse) {
    link += `/${verse}`;
  }
  return (
    <Link
      id={content.id}
      data-type={content.type}
      data-verse-id={content.verseId}
      data-verse-number={content.verseNumber}
      {...props}
      className={cn(style, `hover:underline`, className)}
      href={link}
    >
      {content.text}
    </Link>
  );
}
