import { A } from '@solidjs/router';
import { vectorStoreTool } from '@theaistudybible/ai/chat/tools';
import { ToolInvocation } from 'ai';
import { Search } from 'lucide-solid';
import { For, Show } from 'solid-js';
import { z } from 'zod';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '~/components/ui/accordion';
import { Button } from '~/components/ui/button';
import { H5 } from '~/components/ui/typography';

export type VectorStoreToolProps = {
  toolInvocation: ToolInvocation;
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
                          href={doc.metadata!.url}
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
