import { A } from '@solidjs/router';
import type { CharContent as CharContentType } from '@theaistudybible/core/types/bible';
import type { Accessor } from 'solid-js';
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip';
import { cn } from '~/lib/utils';
import type { HighlightInfo } from '~/types/bible';
import Contents from './contents';

export type CharContentProps = {
  content: CharContentType;
  style: string;
  class?: string;
  highlights?: Accessor<HighlightInfo[]>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  props: any;
};

export default function CharContent(props: CharContentProps) {
  const CharContent = (
    <span
      id={props.content.id}
      data-type={props.content.type}
      data-verse-id={props.content.verseId}
      data-verse-number={props.content.verseNumber}
      {...props}
      class={cn(props.style, props.class)}
    >
      <Contents contents={props.content.contents} highlights={props.highlights} />
    </span>
  );

  const strongsNumber = props.content.attrs?.strong;
  if (strongsNumber) {
    const language = strongsNumber.startsWith('H') ? 'hebrew' : 'greek';
    const number = strongsNumber.slice(1);
    const strongsLink = `https://biblehub.com/strongs/${language}/${number}.htm`;
    return (
      <Tooltip placement="bottom">
        <TooltipTrigger as="span">{CharContent}</TooltipTrigger>
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
