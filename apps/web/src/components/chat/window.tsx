import { Send } from 'lucide-solid';
import {
  Match,
  Switch,
  createComputed,
  createEffect,
  createMemo,
  createSignal,
  on
} from 'solid-js';
import { useChat } from '~/hooks/chat';
import { useAuth } from '~/hooks/clerk';
import { useChatStore } from '../providers/chat';
import { QueryBoundary } from '../query-boundary';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { Spinner } from '../ui/spinner';
import { TextField, TextFieldTextArea } from '../ui/text-field';
import { ChatMenu } from './menu';
import { Message } from './message';

export type ChatWindowProps = {
  chatId?: string;
};

export const ChatWindow = (props: ChatWindowProps) => {
  const { getToken } = useAuth();
  const [, setChatStore] = useChatStore();

  const {
    input,
    setInput,
    handleSubmit,
    messages,
    error,
    isLoading,
    id,
    chatQuery,
    messagesQuery
  } = useChat({
    api: '/api/chat',
    id: () => props.chatId
  });

  createComputed(
    on(
      () => chatQuery.data,
      (chat) => {
        setChatStore('chat', chat ?? undefined);
      }
    )
  );

  const [alert, setAlert] = createSignal<string | undefined>(undefined);

  createEffect(() => {
    const errorValue = error();
    if (errorValue) {
      setAlert(errorValue.message);
    }
  });

  createEffect(() => {
    const alertValue = alert();
    if (alertValue) {
      setTimeout(() => {
        setAlert(undefined);
      }, 5000);
    }
  });

  const messagesReversed = createMemo(() => [...(messages() ?? [])].reverse());

  return (
    <div class="flex h-full flex-col overflow-y-auto">
      <ChatMenu />
      <QueryBoundary query={messagesQuery}>
        {() => (
          <>
            <div class="flex grow flex-col-reverse items-center space-y-2 overflow-y-auto whitespace-pre-wrap border-b">
              {messagesReversed().map((message) => (
                <div class="flex w-full max-w-2xl flex-col">
                  <Message message={message} />
                  <Separator orientation="horizontal" class="w-full" />
                </div>
              ))}
            </div>
            <form
              class="relative flex w-full items-center justify-center px-2 py-2"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!input) {
                  setAlert('Please type a message');
                  return;
                }
                handleSubmit(e, {
                  options: {
                    body: {
                      chatId: id()
                    },
                    headers: {
                      Authorization: `Bearer ${await getToken()()}`
                    }
                  }
                });
              }}
            >
              {alert() && (
                <div class="absolute -top-10 left-1 right-1 z-50 mx-auto my-1 flex max-h-24 place-items-center justify-center overflow-clip">
                  <p class="truncate rounded-xl bg-destructive p-2 text-destructive-foreground">
                    {alert()}
                  </p>
                </div>
              )}
              <div class="flex w-full max-w-2xl items-center rounded-full border py-2 pl-5 pr-1">
                <TextField class="flex flex-1 items-center">
                  <TextFieldTextArea
                    placeholder="Type a message"
                    value={input()}
                    onChange={(e: { currentTarget: HTMLTextAreaElement | undefined }) =>
                      setInput(e.currentTarget?.value ?? '')
                    }
                    class="max-h-24 min-h-[20px] w-full resize-none items-center border-none bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-transparent focus-visible:ring-offset-0"
                    autoResize
                  />
                </TextField>
                <Switch
                  fallback={
                    <Button
                      type="submit"
                      size="icon"
                      variant="outline"
                      class="rounded-full"
                      disabled={isLoading()}
                    >
                      <Send size={20} />
                    </Button>
                  }
                >
                  <Match when={isLoading()}>
                    <Spinner size="sm" />
                  </Match>
                </Switch>
              </div>
            </form>
          </>
        )}
      </QueryBoundary>
    </div>
  );
};
