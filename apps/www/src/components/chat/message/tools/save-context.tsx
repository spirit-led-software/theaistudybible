import type { saveContextTool } from '@/ai/chat/tools';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/www/components/ui/accordion';
import { Spinner } from '@/www/components/ui/spinner';
import { H5, H6 } from '@/www/components/ui/typography';
import type { ToolInvocation } from 'ai';
import { Search } from 'lucide-solid';
import { Show } from 'solid-js';

export type SaveContextToolProps = {
  toolInvocation: ToolInvocation;
  isLoading: boolean;
};

export const SaveContextTool = (props: SaveContextToolProps) => {
  return (
    <div class='flex w-full flex-col pr-5'>
      <H5 class='flex items-center'>
        <Search class='mr-2' size={18} />
        Save Context
      </H5>
      <Show when={props.isLoading && !('result' in props.toolInvocation)}>
        <div class='mt-2 flex w-full flex-col'>
          <H6>Saving</H6>
          <Spinner size='sm' />
        </div>
      </Show>
      <Show
        when={
          'result' in props.toolInvocation &&
          (props.toolInvocation.result as Awaited<ReturnType<(typeof saveContextTool)['execute']>>)
        }
        keyed
      >
        {(result) => (
          <Accordion multiple={false} collapsible class='w-full text-sm'>
            <AccordionItem value='context'>
              <AccordionTrigger>Context</AccordionTrigger>
              <AccordionContent class='whitespace-pre-wrap'>{result.context}</AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </Show>
    </div>
  );
};
