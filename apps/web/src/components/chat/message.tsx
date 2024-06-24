import { A } from '@solidjs/router';
import { DocumentWithScore } from '@theaistudybible/ai/types/document';
import type { Message as AIMessage } from 'ai/solid';
import { For, Match, Show, Switch } from 'solid-js';
import { Markdown } from '~/components/ui/markdown';
import { useUser } from '~/hooks/clerk';
import Icon from '../branding/icon';
import { H6 } from '../ui/typography';

export type MessageProps = {
  message: AIMessage;
};

export const Message = (props: MessageProps) => {
  const { user } = useUser();

  return (
    <div class="flex w-full space-x-4 py-2 pl-5">
      <div class="mt-2 flex h-full items-start">
        {props.message.role === 'user' ? (
          <img src={user()?.imageUrl} alt="Avatar" class="h-10 w-10 rounded-full" />
        ) : (
          <div class="flex h-10 w-10 flex-shrink-0 place-items-center justify-center overflow-hidden rounded-full bg-primary p-2">
            <Icon width={50} height={50} class="flex-shrink-0" />
          </div>
        )}
      </div>
      <Show when={props.message.content} keyed>
        {(content) => <Markdown>{content}</Markdown>}
      </Show>
      <Show when={props.message.toolInvocations?.length}>
        <For each={props.message.toolInvocations}>
          {(toolInvocation) => (
            <Switch>
              <Match when={toolInvocation.toolName === 'vectorDatabase'}>
                <div class="flex flex-col">
                  <H6>References</H6>
                  <Show when={'result' in toolInvocation && toolInvocation.result} keyed>
                    {(result: DocumentWithScore[]) => (
                      <ul class="list-inside list-disc">
                        <For each={result}>
                          {(doc) => (
                            <li class="list-item">
                              <A href={doc.metadata!.url}>{doc.metadata!.name}</A>
                            </li>
                          )}
                        </For>
                      </ul>
                    )}
                  </Show>
                </div>
              </Match>
            </Switch>
          )}
        </For>
      </Show>
    </div>
  );
};
