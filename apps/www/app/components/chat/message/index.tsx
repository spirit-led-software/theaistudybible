import { allChatModels } from '@/ai/models';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/www/components/ui/accordion';
import { Button } from '@/www/components/ui/button';
import { cn } from '@/www/lib/utils';
import { getMessageId } from '@/www/utils/message';
import type { Message as AiMessage, useChat } from '@ai-sdk/react';
import { Copy } from 'lucide-react';
import { Fragment, useMemo } from 'react';
import { toast } from 'sonner';
import { useCopyToClipboard } from 'usehooks-ts';
import { UserAvatar } from '../../auth/user-avatar';
import { Icon } from '../../branding/icon';
import { MemoizedMarkdown } from '../../ui/memoized-markdown';
import { MessageReactionButtons } from './reaction-buttons';
import { Tool } from './tools';

export type MessageProps = {
  previousMessage?: AiMessage;
  nextMessage?: AiMessage;
  message: AiMessage;
  addToolResult: ReturnType<typeof useChat>['addToolResult'];
  isLoading: boolean;
};

export const Message = ({
  message,
  previousMessage,
  nextMessage,
  addToolResult,
  isLoading,
}: MessageProps) => {
  const [, copy] = useCopyToClipboard();

  const modelInfo = useMemo(() => {
    const modelId =
      (message.annotations?.find(
        (a) =>
          typeof a === 'object' &&
          a !== null &&
          !Array.isArray(a) &&
          'modelId' in a &&
          typeof a.modelId === 'string',
      ) as { modelId: string } | undefined) ?? {};

    return allChatModels.find((m) => `${m.host}:${m.id}` === modelId);
  }, [message.annotations]);

  return (
    <article
      className={cn(
        'flex w-full max-w-3xl space-x-4 overflow-hidden px-3 py-4',
        previousMessage?.role === message.role ? 'border-t-0' : 'border-t',
      )}
      aria-label={`${message.role === 'assistant' ? 'AI' : 'User'} message`}
    >
      <div className='mt-2 flex h-full w-10 shrink-0 items-start'>
        {previousMessage?.role !== message.role &&
          (message.role === 'user' ? (
            <UserAvatar className='size-10 shrink-0' aria-label='User avatar' />
          ) : message.role === 'assistant' ? (
            <div
              className={cn(
                'relative flex size-10 shrink-0 place-items-center justify-center rounded-full bg-primary p-2',
                isLoading &&
                  !nextMessage &&
                  'before:absolute before:inset-0 before:scale-110 before:animate-spin before:rounded-full before:border-3 before:border-accent-foreground before:border-t-transparent before:border-r-transparent before:border-l-transparent before:duration-500',
              )}
              aria-label='AI assistant avatar'
            >
              <Icon width={300} height={300} className='shrink-0' aria-hidden='true' />
            </div>
          ) : null)}
      </div>
      <div className='flex w-full flex-col gap-4 overflow-hidden'>
        {(message.parts?.length ?? 0) === 0 ? (
          <>
            {(message.toolInvocations?.length ?? 0) > 0 &&
              message.toolInvocations &&
              message.toolInvocations.map((toolInvocation) => (
                <Tool
                  key={toolInvocation.toolCallId}
                  toolInvocation={toolInvocation}
                  addToolResult={addToolResult}
                  isLoading={isLoading && !nextMessage}
                />
              ))}
            {message.content && (
              <MemoizedMarkdown id={message.id}>{message.content}</MemoizedMarkdown>
            )}
          </>
        ) : (
          message.parts?.map((part, idx) => (
            <Fragment key={`${part.type}-${idx}`}>
              {part.type === 'text' && (
                <MemoizedMarkdown id={message.id}>{part.text}</MemoizedMarkdown>
              )}
              {part.type === 'reasoning' && (
                <Accordion type='single' collapsible>
                  <AccordionItem value='reasoning'>
                    <AccordionTrigger className='text-muted-foreground text-sm'>
                      View reasoning
                    </AccordionTrigger>
                    <AccordionContent>
                      <MemoizedMarkdown id={message.id}>{part.reasoning}</MemoizedMarkdown>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}
              {part.type === 'tool-invocation' && (
                <Tool
                  toolInvocation={part.toolInvocation}
                  addToolResult={addToolResult}
                  isLoading={isLoading && !nextMessage}
                />
              )}
            </Fragment>
          ))
        )}
        {message.role === 'assistant' && message.role !== nextMessage?.role && (
          <div className='flex items-center gap-1' role='toolbar' aria-label='Message actions'>
            {modelInfo && (
              <Button
                variant='outline'
                className='w-fit rounded-full border p-2 text-muted-foreground text-xs'
                asChild
              >
                <a href={modelInfo.link} target='_blank' rel='noopener noreferrer'>
                  {modelInfo.name}
                </a>
              </Button>
            )}
            <Button
              variant='ghost'
              className='h-fit w-fit p-1'
              onClick={() => {
                copy(message.content);
                toast.success('Text copied');
              }}
              aria-label='Copy message'
            >
              <Copy size={15} aria-hidden='true' />
            </Button>
            <MessageReactionButtons messageId={getMessageId(message)} />
          </div>
        )}
      </div>
    </article>
  );
};
