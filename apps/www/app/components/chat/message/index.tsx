import { allChatModels } from '@/ai/models';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/www/components/ui/accordion';
import { Button } from '@/www/components/ui/button';
import { Markdown } from '@/www/components/ui/markdown';
import { cn } from '@/www/lib/utils';
import { getMessageId } from '@/www/utils/message';
import type { Message as AiMessage, useChat } from '@ai-sdk/react';
import { useCopyToClipboard } from '@uidotdev/usehooks';
import { Copy } from 'lucide-react';
import { Fragment, useMemo } from 'react';
import { toast } from 'sonner';
import { UserAvatar } from '../../auth/user-avatar';
import { Icon } from '../../branding/icon';
import { MessageReactionButtons } from './reaction-buttons';
import { Tool } from './tools';

export type MessageProps = {
  previousMessage?: AiMessage;
  nextMessage?: AiMessage;
  message: AiMessage;
  addToolResult: ReturnType<typeof useChat>['addToolResult'];
  isLoading: boolean;
};

export const Message = (props: MessageProps) => {
  const [, copy] = useCopyToClipboard();

  const modelInfo = useMemo(() => {
    const modelId =
      (props.message.annotations?.find(
        (a) =>
          typeof a === 'object' &&
          a !== null &&
          !Array.isArray(a) &&
          'modelId' in a &&
          typeof a.modelId === 'string',
      ) as { modelId: string } | undefined) ?? {};

    return allChatModels.find((m) => `${m.host}:${m.id}` === modelId);
  }, [props.message.annotations]);

  return (
    <article
      className={cn(
        'flex w-full max-w-3xl space-x-4 overflow-hidden px-3 py-4',
        props.previousMessage?.role === props.message.role ? 'border-t-0' : 'border-t',
      )}
      aria-label={`${props.message.role === 'assistant' ? 'AI' : 'User'} message`}
    >
      <div className='mt-2 flex h-full w-10 shrink-0 items-start'>
        {props.previousMessage?.role !== props.message.role &&
          (props.message.role === 'user' ? (
            <UserAvatar className='size-10 shrink-0' aria-label='User avatar' />
          ) : props.message.role === 'assistant' ? (
            <div
              className={cn(
                'relative flex size-10 shrink-0 place-items-center justify-center rounded-full bg-primary p-2',
                props.isLoading &&
                  !props.nextMessage &&
                  'before:absolute before:inset-0 before:scale-110 before:animate-spin before:rounded-full before:border-3 before:border-accent-foreground before:border-t-transparent before:border-r-transparent before:border-l-transparent before:duration-500',
              )}
              aria-label='AI assistant avatar'
            >
              <Icon width={300} height={300} className='shrink-0' aria-hidden='true' />
            </div>
          ) : null)}
      </div>
      <div className='flex w-full flex-col gap-4 overflow-hidden'>
        {(props.message.parts?.length ?? 0) === 0 ? (
          <>
            {(props.message.toolInvocations?.length ?? 0) > 0 &&
              props.message.toolInvocations &&
              props.message.toolInvocations.map((toolInvocation) => (
                <Tool
                  key={toolInvocation.toolCallId}
                  toolInvocation={toolInvocation}
                  addToolResult={props.addToolResult}
                  isLoading={props.isLoading && !props.nextMessage}
                />
              ))}
            {props.message.content && <Markdown>{props.message.content}</Markdown>}
          </>
        ) : (
          props.message.parts?.map((part, idx) => (
            <Fragment key={`${part.type}-${idx}`}>
              {part.type === 'text' && <Markdown>{part.text}</Markdown>}
              {part.type === 'reasoning' && (
                <Accordion type='single' collapsible>
                  <AccordionItem value='reasoning'>
                    <AccordionTrigger className='text-muted-foreground text-sm'>
                      View reasoning
                    </AccordionTrigger>
                    <AccordionContent>
                      <Markdown>{part.reasoning}</Markdown>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}
              {part.type === 'tool-invocation' && (
                <Tool
                  toolInvocation={part.toolInvocation}
                  addToolResult={props.addToolResult}
                  isLoading={props.isLoading && !props.nextMessage}
                />
              )}
            </Fragment>
          ))
        )}
        {props.message.role === 'assistant' && props.message.role !== props.nextMessage?.role && (
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
                copy(props.message.content);
                toast.success('Text copied');
              }}
              aria-label='Copy message'
            >
              <Copy size={15} aria-hidden='true' />
            </Button>
            <MessageReactionButtons messageId={getMessageId(props.message)} />
          </div>
        )}
      </div>
    </article>
  );
};
