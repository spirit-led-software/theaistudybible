'use client';

import Icon from '@/components/branding/icon';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useBibleStore } from '@/hooks/use-bible-store';
import { useChatStore } from '@/hooks/use-chat-store';
import { usePublicEnv } from '@/hooks/use-public-env';
import { SignInButton, useAuth, useUser } from '@clerk/nextjs';
import { createId } from '@paralleldrive/cuid2';
import { useChat } from 'ai/react';
import { ChevronDown, Send } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { H3, P } from '../../ui/typeography';

export default function ChatWindow() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const { isSignedIn } = useUser();
  const { PUBLIC_API_URL } = usePublicEnv();

  const { open, setOpen } = useBibleStore((store) => ({
    open: store.chatOpen,
    setOpen: store.setChatOpen
  }));

  const { chatId, setChatId, query, setQuery } = useChatStore((store) => store);
  const [lastAiResponseId, setLastAiResponseId] = useState<string | undefined>(undefined);

  const {
    input,
    handleSubmit,
    handleInputChange,
    messages,
    setMessages,
    error,
    isLoading,
    append
  } = useChat({
    api: `${PUBLIC_API_URL}/chat`,
    id: chatId,
    generateId: createId,
    sendExtraMessageFields: true,
    onResponse(response) {
      const newChatId = response.headers.get('x-chat-id');
      if (newChatId) {
        setChatId(chatId);
      }
      const aiResponseId = response.headers.get('x-ai-response-id');
      if (aiResponseId) {
        setLastAiResponseId(aiResponseId);
      }
    }
  });

  const [alert, setAlert] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (lastAiResponseId && !isLoading) {
      setMessages([
        ...messages.slice(0, -1),
        {
          ...messages.at(-1)!,
          id: lastAiResponseId
        }
      ]);
      setLastAiResponseId(undefined);
    }
  }, [messages, setMessages, lastAiResponseId, setLastAiResponseId, isLoading]);

  const appendQuery = useCallback(
    async (query: string) => {
      append(
        {
          role: 'user',
          content: query
        },
        {
          options: {
            headers: {
              Authorization: `Bearer ${await getToken()}`
            }
          }
        }
      );
      setQuery(undefined);
    },
    [append, setQuery, getToken]
  );

  useEffect(() => {
    if (query) {
      appendQuery(query);
    }
  }, [query, appendQuery]);

  useEffect(() => {
    if (error) {
      setAlert(error.message);
    }
  }, [error]);

  useEffect(() => {
    if (alert) {
      setTimeout(() => {
        setAlert(undefined);
      }, 5000);
    }
  }, [alert]);

  return (
    <div
      className={`fixed bottom-0 left-12 right-12 z-40 flex flex-col overflow-hidden rounded-t-lg border bg-background shadow-xl duration-200 md:left-1/4 md:right-1/4 xl:left-1/3 xl:right-1/3 ${open ? 'h-2/3 delay-200' : 'h-0'}`}
    >
      <div className="flex w-full place-items-center justify-between bg-primary px-1 py-2">
        <H3 className="px-2 text-primary-foreground">Chat</H3>
        <Button
          variant={'ghost'}
          onClick={() => setOpen(!open)}
          className="px-2 text-primary-foreground"
        >
          <ChevronDown size={20} />
        </Button>
      </div>
      {isSignedIn ? (
        <>
          <div className="relative flex-1 flex-col-reverse space-y-2 overflow-y-auto whitespace-pre-wrap">
            {messages.map((message) => (
              <div key={message.id} className="flex w-full flex-col">
                <Separator orientation="horizontal" className="w-full" />
                <div className="flex w-full place-items-start space-x-4 px-2 py-3">
                  {message.role === 'user' ? (
                    <Avatar>
                      <AvatarImage src={user!.imageUrl!} />
                      <AvatarFallback>{user?.fullName}</AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="flex h-10 w-10 flex-shrink-0 place-items-center justify-center overflow-hidden rounded-full bg-primary p-2">
                      <Icon width={50} height={50} className="flex-shrink-0" />
                    </div>
                  )}
                  <p>{message.content}</p>
                </div>
              </div>
            ))}
          </div>
          <form
            className="relative flex w-full px-2 py-2"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!input) {
                setAlert('Please type a message');
                return;
              }
              handleSubmit(e, {
                options: {
                  headers: {
                    Authorization: `Bearer ${await getToken({
                      template: 'Testing'
                    })}`
                  }
                }
              });
            }}
          >
            {alert && (
              <div className="absolute -top-10 left-1 right-1 z-50 mx-auto my-1 flex max-h-24 place-items-center justify-center overflow-clip">
                <p className="truncate rounded-xl bg-destructive p-2 text-destructive-foreground">
                  {alert}
                </p>
              </div>
            )}
            <Input
              placeholder="Type a message"
              value={input}
              onChange={handleInputChange}
              className="rounded-r-none"
            />
            <Button type="submit" className="rounded-l-none">
              <Send size={20} />
            </Button>
          </form>
        </>
      ) : (
        <div className="flex h-full w-full flex-col place-items-center justify-center">
          <P>
            Please{' '}
            <Button
              variant={'link'}
              asChild
              className="px-0 capitalize text-accent-foreground"
              disabled={isLoading}
            >
              <SignInButton />
            </Button>{' '}
            to chat
          </P>
        </div>
      )}
    </div>
  );
}
