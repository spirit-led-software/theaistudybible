import type { useChat } from '@ai-sdk/solid';
import { ArrowUp, ChevronLeft, ChevronRight, Lightbulb } from 'lucide-solid';
import { createSignal } from 'solid-js';
import { Button } from '../../ui/button';
import { Markdown } from '../../ui/markdown';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../ui/tooltip';

export type SuggestionsMessageProps = {
  suggestions: string[];
  append: ReturnType<typeof useChat>['append'];
};

export const SuggestionsMessage = (props: SuggestionsMessageProps) => {
  const [currentSuggestion, setCurrentSuggestion] = createSignal(0);

  return (
    <article
      class='flex w-full max-w-2xl space-x-4 border-t px-3 py-4'
      aria-label='Follow-up suggestions'
    >
      <div class='mt-2 flex h-full w-10 shrink-0 items-start'>
        <Tooltip>
          <TooltipTrigger
            as='div'
            class='flex size-10 items-center justify-center rounded-full border'
          >
            <Lightbulb />
          </TooltipTrigger>
          <TooltipContent>
            <p>Follow-up suggestions</p>
          </TooltipContent>
        </Tooltip>
      </div>
      <div class='flex w-full flex-col'>
        <Markdown>{props.suggestions[currentSuggestion()]}</Markdown>
        <div class='mt-4 flex w-full items-center gap-2'>
          <div class='flex items-center justify-between'>
            <Button
              variant='ghost'
              size='icon'
              class='size-8 p-0'
              disabled={currentSuggestion() === 0}
              onClick={() => setCurrentSuggestion((prev) => prev - 1)}
            >
              <ChevronLeft />
            </Button>
            <div class='w-8 text-center text-muted-foreground text-sm'>
              {currentSuggestion() + 1} / {props.suggestions.length}
            </div>
            <Button
              variant='ghost'
              size='icon'
              class='size-8 p-0'
              disabled={currentSuggestion() === props.suggestions.length - 1}
              onClick={() => setCurrentSuggestion((prev) => prev + 1)}
            >
              <ChevronRight />
            </Button>
          </div>
          <Button
            variant='outline'
            size='icon'
            class='size-8 shrink-0 rounded-full p-0'
            onClick={() =>
              props.append({ role: 'user', content: props.suggestions[currentSuggestion()] })
            }
          >
            <ArrowUp size={16} />
          </Button>
        </div>
      </div>
    </article>
  );
};
