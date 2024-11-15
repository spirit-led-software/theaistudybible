import type { VerseNote } from '@/schemas/bibles';
import type { CharContent as CharContentType } from '@/schemas/bibles/contents';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/www/components/ui/tooltip';
import { cn } from '@/www/lib/utils';
import type { HighlightInfo } from '@/www/types/bible';
import { A } from '@solidjs/router';
import { Contents } from './index';

export type CharContentProps = {
  content: CharContentType;
  style: string;
  class?: string;
  highlights?: HighlightInfo[];
  notes?: VerseNote[];
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  props: any;
};

export function CharContent(props: CharContentProps) {
  const CharContent = (
    <span
      id={props.content.id}
      data-type={props.content.type}
      data-verse-id={props.content.verseId}
      data-verse-number={props.content.verseNumber}
      {...props.props}
      class={cn(props.style, 'h-full w-full', props.class)}
    >
      <Contents
        contents={props.content.contents}
        highlights={props.highlights}
        notes={props.notes}
      />
    </span>
  );

  const strongsNumber = props.content.attrs?.strong;
  if (strongsNumber) {
    const language = strongsNumber.startsWith('H') ? 'hebrew' : 'greek';
    const number = strongsNumber.slice(1);
    const strongsLink = `https://biblehub.com/strongs/${language}/${number}.htm`;
    return (
      <Tooltip placement='bottom'>
        <TooltipTrigger as='span'>{CharContent}</TooltipTrigger>
        <TooltipContent class='flex w-fit justify-center indent-0'>
          <div class='w-full text-center'>
            <h6 class='font-bold'>Strong{"'"}s</h6>
            <A href={strongsLink} class='hover:underline'>
              {strongsNumber}
            </A>
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  return CharContent;
}
