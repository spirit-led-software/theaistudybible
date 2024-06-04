import { A } from '@solidjs/router';
import type { CharContent as CharContentType } from '@theaistudybible/core/types/bible';
import type { InferResponseType } from 'hono/client';
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip';
import { cn } from '~/lib/utils';
import type { RpcClient } from '~/types/rpc';
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
  bible: InferResponseType<RpcClient['bibles'][':id']['$get']>['data'];
  book: InferResponseType<RpcClient['bibles'][':id']['books'][':bookId']['$get']>['data'];
  chapter: InferResponseType<RpcClient['bibles'][':id']['chapters'][':chapterId']['$get']>['data'];
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
      class={cn(style, className)}
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
      <Tooltip placement="bottom">
        <TooltipTrigger>{CharContent}</TooltipTrigger>
        <TooltipContent class="flex w-fit justify-center indent-0">
          <div class="w-full text-center">
            <h6 class="font-bold">Strong{"'"}s</h6>
            <A href={strongsLink} class="hover:underline">
              {strongsNumber}
            </A>
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  return CharContent;
}
