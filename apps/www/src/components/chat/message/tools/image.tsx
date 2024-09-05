import type { generateImageTool } from '@/ai/chat/tools';
import { Spinner } from '@/www/components/ui/spinner';
import { H5, H6 } from '@/www/components/ui/typography';
import { A } from '@solidjs/router';
import type { ToolInvocation } from 'ai';
import { Image } from 'lucide-solid';
import { Show } from 'solid-js';
import type { z } from 'zod';

export type GenerateImageToolProps = {
  toolInvocation: ToolInvocation;
  isLoading: boolean;
};

export const GenerateImageTool = (props: GenerateImageToolProps) => {
  return (
    <div class="flex w-full flex-col">
      <H5 class="flex items-center">
        <Image class="mr-2" size={18} />
        Generate Image
      </H5>
      <Show
        when={
          props.toolInvocation.args as z.infer<ReturnType<typeof generateImageTool>['parameters']>
        }
        keyed
      >
        {(toolArgs) => (
          <div class="flex items-center space-x-2 text-sm">
            <span>{toolArgs.prompt}</span>
          </div>
        )}
      </Show>
      <Show when={props.isLoading && !('result' in props.toolInvocation)}>
        <div class="mt-2 flex w-full flex-col">
          <H6>Generating</H6>
          <Spinner size="sm" />
        </div>
      </Show>
      <Show
        when={
          'result' in props.toolInvocation &&
          (props.toolInvocation.result as Awaited<
            ReturnType<ReturnType<typeof generateImageTool>['execute']>
          >)
        }
        keyed
      >
        {(result) => (
          <div class="mt-2 flex w-full flex-col">
            <H6>Result</H6>
            <Show
              when={result.status === 'error' && result}
              fallback={
                <div class="flex flex-col text-sm">
                  <Show when={result.status === 'success' && result} keyed>
                    {(successResult) => (
                      <div class="flex flex-col gap-2">
                        <A href={successResult.image.url!} class="w-fit">
                          <img
                            src={successResult.image.url!}
                            alt={successResult.image.prompt!}
                            loading="lazy"
                            width={128}
                            height={128}
                            class="rounded-md"
                          />
                        </A>
                        <p class="text-xs">
                          <strong>Revised Prompt:</strong> {successResult.image.prompt!}
                        </p>
                      </div>
                    )}
                  </Show>
                </div>
              }
              keyed
            >
              {(failedResult) => (
                <div class="flex flex-col text-sm">
                  <span>Failed</span>
                  <span>{failedResult.message}</span>
                </div>
              )}
            </Show>
          </div>
        )}
      </Show>
    </div>
  );
};
