import type { generateImageTool } from '@/ai/chat/tools';
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
import type { ToolInvocation } from 'ai';
import { Image as ImageIcon } from 'lucide-react';
import type { z } from 'zod';

export type GenerateImageToolProps = {
  toolInvocation: ToolInvocation;
  isLoading: boolean;
};

export const GenerateImageTool = (props: GenerateImageToolProps) => {
  const toolArgs = props.toolInvocation.args as z.infer<
    ReturnType<typeof generateImageTool>['parameters']
  >;

  const result =
    'result' in props.toolInvocation
      ? (props.toolInvocation.result as Awaited<
          ReturnType<ReturnType<typeof generateImageTool>['execute']>
        >)
      : null;

  return (
    <div className='flex w-full flex-col'>
      <H5 className='flex items-center'>
        <ImageIcon className='mr-2' size={18} />
        Generate Image
      </H5>
      {toolArgs && (
        <div className='flex w-full flex-col'>
          {props.isLoading ? (
            <div className='animate-pulse'>{toolArgs.prompt}</div>
          ) : (
            <Markdown>{toolArgs.prompt}</Markdown>
          )}
        </div>
      )}
      {props.isLoading && !result && (
        <div className='mt-2 flex w-full flex-col'>
          <H6>Generating</H6>
          <Spinner size='sm' />
        </div>
      )}
      {result && (
        <div className='mt-2 flex w-full flex-col'>
          <H6>Result</H6>
          {result.status === 'error' ? (
            <div className='flex flex-col text-sm'>
              <span>Failed</span>
              <span>{result.message}</span>
            </div>
          ) : (
            <div className='flex w-full flex-col text-sm'>
              {result.status === 'success' && (
                <div className='flex w-full flex-col gap-2'>
                  {/* Show small thumbnail here */}
                  <div className='h-auto w-[128px]'>
                    <Dialog>
                      <DialogTrigger>
                        <div className='relative'>
                          <img
                            src={result.image.url!}
                            alt={result.image.prompt ?? result.image.userPrompt}
                            loading='lazy'
                            width={128}
                            className='h-auto w-full rounded-md'
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const fallback = target.nextElementSibling;
                              if (fallback) fallback.classList.remove('hidden');
                            }}
                          />
                          <div className='flex hidden h-full min-h-52 w-full items-center justify-center rounded-md bg-muted'>
                            <Spinner size='sm' />
                          </div>
                        </div>
                      </DialogTrigger>
                      <DialogContent className='max-w-[var(--breakpoint-lg)]'>
                        <DialogHeader>
                          <DialogTitle>Generated Image</DialogTitle>
                        </DialogHeader>
                        <a href={result.image.url!} target='_blank' rel='noopener noreferrer'>
                          <div className='relative'>
                            <img
                              src={result.image.url!}
                              alt={result.image.prompt ?? result.image.userPrompt}
                              loading='lazy'
                              className='h-auto w-full rounded-md'
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const fallback = target.nextElementSibling;
                                if (fallback) fallback.classList.remove('hidden');
                              }}
                            />
                            <div className='flex hidden h-full min-h-52 w-full items-center justify-center rounded-md bg-muted'>
                              <Spinner size='sm' />
                            </div>
                          </div>
                        </a>
                      </DialogContent>
                    </Dialog>
                  </div>
                  {result.image.prompt && (
                    <p className='text-xs'>
                      <strong>Revised Prompt:</strong> {result.image.prompt}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
