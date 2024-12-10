import type { generateImageTool } from '@/ai/chat/tools';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/www/components/ui/dialog';
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
        keyed
      >
        {(toolArgs) => (
          <div class='flex items-center space-x-2 text-sm'>
            <span>{toolArgs.prompt}</span>
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
                <div class='flex flex-col text-sm'>
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
                                  alt={successResult.image.prompt ?? 'Generated Image'}
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
                            <DialogContent class='max-w-screen-lg'>
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
                                    alt={successResult.image.prompt ?? 'Generated Image'}
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
                        <p class='text-xs'>
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
