import type { generateImageTool } from '@/ai/chat/tools';
import { AnimatedMarkdown } from '@/www/components/ui/animated-markdown';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/www/components/ui/dialog';
import { Markdown } from '@/www/components/ui/markdown';
import { Spinner } from '@/www/components/ui/spinner';
import { H5, H6 } from '@/www/components/ui/typography';
import { Image } from '@kobalte/core';
import { A } from '@solidjs/router';
import type { ToolInvocation } from 'ai';
import { Image as ImageIcon } from 'lucide-solid';
import { Show } from 'solid-js';
import type { z } from 'zod';

export type GenerateImageToolProps = {
  toolInvocation: ToolInvocation;
  isLoading: boolean;
};

export const GenerateImageTool = (props: GenerateImageToolProps) => {
  return (
    <div class='flex w-full flex-col'>
      <H5 class='flex items-center'>
        <ImageIcon class='mr-2' size={18} />
        Generate Image
      </H5>
      <Show
        when={
          props.toolInvocation.args as z.infer<ReturnType<typeof generateImageTool>['parameters']>
        }
      >
        {(toolArgs) => (
          <div class='flex w-full flex-col'>
            <Show when={props.isLoading} fallback={<Markdown>{toolArgs().prompt}</Markdown>}>
              <AnimatedMarkdown>{toolArgs().prompt}</AnimatedMarkdown>
            </Show>
          </div>
        )}
      </Show>
      <Show when={props.isLoading && !('result' in props.toolInvocation)}>
        <div class='mt-2 flex w-full flex-col'>
          <H6>Generating</H6>
          <Spinner size='sm' />
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
          <div class='mt-2 flex w-full flex-col'>
            <H6>Result</H6>
            <Show
              when={result.status === 'error' && result}
              fallback={
                <div class='flex w-full flex-col text-sm'>
                  <Show when={result.status === 'success' && result} keyed>
                    {(successResult) => (
                      <div class='flex w-full flex-col gap-2'>
                        {/* Show small thumbnail here */}
                        <div class='h-auto w-[128px]'>
                          <Dialog>
                            <DialogTrigger>
                              <Image.Root>
                                <Image.Img
                                  src={successResult.image.url!}
                                  alt={successResult.image.prompt ?? successResult.image.userPrompt}
                                  loading='lazy'
                                  width={128}
                                  class='h-auto w-full rounded-md'
                                />
                                <Image.Fallback>
                                  <div class='flex h-full min-h-52 w-full items-center justify-center rounded-md bg-muted'>
                                    <Spinner size='sm' />
                                  </div>
                                </Image.Fallback>
                              </Image.Root>
                            </DialogTrigger>
                            <DialogContent class='max-w-(--breakpoint-lg)'>
                              <DialogHeader>
                                <DialogTitle>Generated Image</DialogTitle>
                              </DialogHeader>
                              <A
                                href={successResult.image.url!}
                                target='_blank'
                                rel='noopener noreferrer'
                              >
                                <Image.Root>
                                  <Image.Img
                                    src={successResult.image.url!}
                                    alt={
                                      successResult.image.prompt ?? successResult.image.userPrompt
                                    }
                                    loading='lazy'
                                    class='h-auto w-full rounded-md'
                                  />
                                  <Image.Fallback>
                                    <div class='flex h-full min-h-52 w-full items-center justify-center rounded-md bg-muted'>
                                      <Spinner size='sm' />
                                    </div>
                                  </Image.Fallback>
                                </Image.Root>
                              </A>
                            </DialogContent>
                          </Dialog>
                        </div>
                        <Show when={successResult.image.prompt} keyed>
                          {(prompt) => (
                            <p class='text-xs'>
                              <strong>Revised Prompt:</strong> {prompt}
                            </p>
                          )}
                        </Show>
                      </div>
                    )}
                  </Show>
                </div>
              }
              keyed
            >
              {(failedResult) => (
                <div class='flex flex-col text-sm'>
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
