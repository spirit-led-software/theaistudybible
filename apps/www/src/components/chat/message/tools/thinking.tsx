import type { thinkingTool } from '@/ai/chat/tools';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/www/components/ui/accordion';
import { AnimatedMarkdown } from '@/www/components/ui/animated-markdown';
import { Markdown } from '@/www/components/ui/markdown';
import { Spinner } from '@/www/components/ui/spinner';
import type { ToolInvocation } from 'ai';
import { Lightbulb } from 'lucide-solid';
import { Show } from 'solid-js';
import type { z } from 'zod';

export type ThinkingToolProps = {
  toolInvocation: ToolInvocation;
  isLoading: boolean;
};

export const ThinkingTool = (props: ThinkingToolProps) => {
  return (
    <div class='flex w-full flex-col pr-5'>
      <Accordion multiple={false} collapsible>
        <AccordionItem value='thinking' disabled={!props.toolInvocation.args}>
          <AccordionTrigger>
            <div class='flex items-center'>
              <Show when={props.isLoading} fallback={<Lightbulb class='mr-2' size={18} />}>
                <Spinner size='sm' class='mr-2' />
              </Show>
              Thinking
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Show
              when={
                props.toolInvocation.args as z.infer<ReturnType<typeof thinkingTool>['parameters']>
              }
            >
              {(toolArgs) => (
                <Show when={props.isLoading} fallback={<Markdown>{toolArgs().thoughts}</Markdown>}>
                  <AnimatedMarkdown>{toolArgs().thoughts}</AnimatedMarkdown>
                </Show>
              )}
            </Show>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};
