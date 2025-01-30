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
import { ArrowUpRightFromSquare, BookOpenIcon, FileIcon, Search } from 'lucide-solid';
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
      <Show
        when={
          props.toolInvocation.args as z.infer<ReturnType<typeof vectorStoreTool>['parameters']>
        }
      >
        {(toolArgs) => {
          const [container] = createAutoAnimate();
          return (
            <div class='flex w-full flex-col'>
              <H6 class='font-goldman font-normal'>Queries</H6>
              <div ref={container} class='flex flex-wrap gap-2 px-2 py-1'>
                <For each={toolArgs().terms}>
                  {(searchTerm) => (
                    <div class='rounded-full bg-primary px-2 py-1 text-primary-foreground text-xs'>
                      {searchTerm.term}
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
          (props.toolInvocation.result as Awaited<
            ReturnType<ReturnType<typeof vectorStoreTool>['execute']>
          >)
        }
        keyed
      >
        {(result) => (
          <Show
            when={result.status === 'success' && result.documents}
            fallback={<div class='text-muted-foreground text-sm'>Failed to fetch documents</div>}
            keyed
          >
            {(docs) => (
              <Accordion multiple={false} collapsible class='w-full text-sm'>
                <AccordionItem value='results'>
                  <AccordionTrigger>Results ({docs.length})</AccordionTrigger>
                  <AccordionContent>
                    <div class='flex flex-wrap gap-2'>
                      <For each={docs}>
                        {(doc) => (
                          <A
                            href={doc.metadata?.url ?? ''}
                            class={cn(
                              buttonVariants({ variant: 'outline' }),
                              'group flex h-fit max-w-full items-center rounded-full px-3 py-2 text-xs',
                            )}
                            target={
                              doc.metadata?.url?.includes(import.meta.env.PUBLIC_WEBAPP_URL)
                                ? '_self'
                                : '_blank'
                            }
                          >
                            <span class='mr-1'>
                              <Switch fallback={<ArrowUpRightFromSquare size={12} />}>
                                <Match when={doc.metadata?.type?.toUpperCase() === 'BIBLE'}>
                                  <BookOpenIcon size={12} />
                                </Match>
                                <Match when={doc.metadata?.type?.toUpperCase() === 'REMOTE_FILE'}>
                                  <FileIcon size={12} />
                                </Match>
                              </Switch>
                            </span>
                            <span class='line-clamp-2 text-wrap group-hover:line-clamp-none'>
                              {doc.metadata?.name ?? doc.metadata?.url ?? ''}
                            </span>
                          </A>
                        )}
                      </For>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}
          </Show>
        )}
      </Show>
    </div>
  );
};
