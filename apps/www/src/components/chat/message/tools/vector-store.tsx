import type { vectorStoreTool } from '@/ai/chat/tools';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/www/components/ui/accordion';
import { buttonVariants } from '@/www/components/ui/button';
import { Spinner } from '@/www/components/ui/spinner';
import { H5, H6 } from '@/www/components/ui/typography';
import { cn } from '@/www/lib/utils';
import { createAutoAnimate } from '@formkit/auto-animate/solid';
import { A } from '@solidjs/router';
import type { ToolInvocation } from 'ai';
import { ArrowUpRightFromSquare, BookOpenIcon, Search } from 'lucide-solid';
import { For, Match, Show, Switch } from 'solid-js';
import type { z } from 'zod';

export type VectorStoreToolProps = {
  toolInvocation: ToolInvocation;
  isLoading: boolean;
};

export const VectorStoreTool = (props: VectorStoreToolProps) => {
  return (
    <div class='flex w-full flex-col pr-5'>
      <H5 class='flex items-center'>
        <Search class='mr-2' size={18} />
        Search for Sources
      </H5>
      <Show when={props.toolInvocation.args as z.infer<(typeof vectorStoreTool)['parameters']>}>
        {(toolArgs) => {
          const [container] = createAutoAnimate();
          return (
            <div class='flex w-full flex-col'>
              <H6 class='font-goldman font-normal'>Queries</H6>
              <div ref={container} class='flex flex-wrap gap-2 px-2 py-1'>
                <For each={toolArgs().terms}>
                  {(term) => (
                    <div class='rounded-full bg-primary px-2 py-1 text-primary-foreground text-xs'>
                      {term}
                    </div>
                  )}
                </For>
              </div>
            </div>
          );
        }}
      </Show>
      <Show when={props.isLoading && !('result' in props.toolInvocation)}>
        <div class='mt-2 flex w-full flex-col'>
          <H6>Searching</H6>
          <Spinner size='sm' />
        </div>
      </Show>
      <Show
        when={
          'result' in props.toolInvocation &&
          (props.toolInvocation.result as Awaited<ReturnType<(typeof vectorStoreTool)['execute']>>)
        }
        keyed
      >
        {(result) => (
          <Accordion multiple={false} collapsible class='w-full text-sm'>
            <AccordionItem value='results'>
              <AccordionTrigger>Results ({result.length})</AccordionTrigger>
              <AccordionContent>
                <div class='flex flex-wrap gap-2'>
                  <For each={result}>
                    {(doc) => (
                      <A
                        href={doc.metadata?.url ?? ''}
                        class={cn(
                          buttonVariants({ variant: 'outline' }),
                          'flex h-fit w-fit items-center rounded-full px-2 py-1 text-xs',
                        )}
                      >
                        <span class='mr-1 inline-block'>
                          <Switch fallback={<ArrowUpRightFromSquare size={12} />}>
                            <Match when={doc.metadata?.type === 'bible'}>
                              <BookOpenIcon size={12} />
                            </Match>
                          </Switch>
                        </span>
                        {doc.metadata?.name ?? doc.metadata?.title ?? doc.metadata?.url ?? ''}
                      </A>
                    )}
                  </For>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </Show>
    </div>
  );
};
