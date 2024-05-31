import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { Routes } from '@/types/rpc';
import type { CharContent as CharContentType } from '@core/types/bible';
import type { InferResponseType } from 'hono/client';
import Link from 'next/link';
import Contents from './contents';

export default function CharContent({
  content,
  style,
  className,
  bible,
  book,
  chapter,
  highlights,
  props
}: {
  content: CharContentType;
  style: string;
  className?: string;
  bible: InferResponseType<Routes['bibles'][':id']['$get']>['data'];
  book: InferResponseType<Routes['bibles'][':id']['books'][':bookId']['$get']>['data'];
  chapter: InferResponseType<Routes['bibles'][':id']['chapters'][':chapterId']['$get']>['data'];
  highlights?: {
    id: string;
    color: string;
  }[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  props: any;
}) {
  const CharContent = (
    <span
      key={content.id}
      id={content.id}
      data-type={content.type}
      data-verse-id={content.verseId}
      data-verse-number={content.verseNumber}
      {...props}
      className={cn(style, className)}
    >
      <Contents
        bible={bible}
        book={book}
        chapter={chapter}
        contents={content.contents}
        highlights={highlights}
      />
    </span>
  );

  const strongsNumber = content.attrs?.strong;
  if (strongsNumber) {
    const language = strongsNumber.startsWith('H') ? 'hebrew' : 'greek';
    const number = strongsNumber.slice(1);
    const strongsLink = `https://biblehub.com/strongs/${language}/${number}.htm`;
    return (
      <Tooltip key={content.id}>
        <TooltipTrigger>{CharContent}</TooltipTrigger>
        <TooltipContent side="bottom" className="flex w-fit justify-center indent-0">
          <div className="w-full text-center">
            <h6 className="font-bold">Strong{"'"}s</h6>
            <Link href={strongsLink} className="hover:underline">
              {strongsNumber}
            </Link>
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  return CharContent;
}
