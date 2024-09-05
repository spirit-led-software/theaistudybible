import type { vectorStoreTool } from '@/ai/chat/tools';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/www/components/ui/accordion';
import { Button } from '@/www/components/ui/button';
import { Spinner } from '@/www/components/ui/spinner';
import { H5, H6 } from '@/www/components/ui/typography';
import { A } from '@solidjs/router';
import type { ToolInvocation } from 'ai';
import { Search } from 'lucide-solid';
import { For, Show } from 'solid-js';
import type { z } from 'zod';

export type VectorStoreToolProps = {
  toolInvocation: ToolInvocation;
  isLoading: boolean;
};

export const VectorStoreTool = (props: VectorStoreToolProps) => {
  return (
    <div class="flex w-full flex-col pr-5">
      <H5 class="flex items-center">
        <Search class="mr-2" size={18} />
        Search for Sources
      </H5>
      <Show
        when={props.toolInvocation.args as z.infer<(typeof vectorStoreTool)['parameters']>}
        keyed
      >
        {(toolArgs) => (
          <Accordion multiple={false} collapsible class="w-full text-sm">
            <AccordionItem value="terms">
              <AccordionTrigger>Queries</AccordionTrigger>
              <AccordionContent>
                <ul class="list-inside list-none">
                  <For each={toolArgs.terms}>
                    {(term) => <li class="list-item text-xs">{term}</li>}
                  </For>
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </Show>
      <Show when={props.isLoading && !('result' in props.toolInvocation)}>
        <div class="mt-2 flex w-full flex-col">
          <H6>Searching</H6>
          <Spinner size="sm" />
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
          <Accordion multiple={false} collapsible class="w-full text-sm">
            <AccordionItem value="results">
              <AccordionTrigger>Results ({result.length})</AccordionTrigger>
              <AccordionContent>
                <ul class="list-inside list-disc">
                  <For each={result}>
                    {(doc) => (
                      <li class="list-item">
                        <Button
                          as={A}
                          href={doc.metadata!.url as string}
                          variant="link"
                          class="h-fit p-0 text-xs"
                        >
                          {doc.metadata!.name}
                        </Button>
                      </li>
                    )}
                  </For>
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </Show>
    </div>
  );
};
