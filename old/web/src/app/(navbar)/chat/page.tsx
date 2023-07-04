'use client';

import { Message } from '@/components/chat';
import { getChatMessageResult, sendMessage } from '@/lib/client/chat-messages';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { AiOutlineSend } from 'react-icons/ai';
import { IoIosArrowDown, IoIosArrowForward } from 'react-icons/io';
import TextAreaAutosize from 'react-textarea-autosize';

type MessageData = {
  id: string;
  text: string;
  sender: string;
};

export default function ChatPage() {
  const router = useRouter();
  const path = usePathname();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const [alert, setAlert] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentMessage, setCurrentMessage] = useState<string | null>(null);
  const [currentResponse, setCurrentResponse] = useState<string | null>(null);
  const [showScrollToBottomButton, setShowScrollToBottomButton] =
    useState<boolean>(false);

  const readHandler = async (
    reader: ReadableStreamDefaultReader<Uint8Array>
  ) => {
    const timeout = setTimeout(() => {
      reader.cancel();
      setIsLoading(false);
      setAlert('Request timed out');
    }, 20000);
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        const data = new TextDecoder()
          .decode(value)
          .replaceAll('data: ', '')
          .split(/\n\n/);
        for (const chunkData of data) {
          if (chunkData === '') continue;
          console.log('Chunk:', chunkData);
          const chunk = JSON.parse(chunkData);
          const text = chunk.text;
          console.log('Text:', text);
          setCurrentResponse((currentResponse) => {
            return currentResponse ? currentResponse + text : text;
          });
        }
      }
    }
    clearTimeout(timeout);
  };

  const handleSubmit = async (event: any) => {
    event.preventDefault();
    const message = inputRef?.current?.value;
    if (message) {
      inputRef.current.value = '';
      setIsLoading(true);
      setAlert(null);
      setCurrentMessage(message);
      setCurrentResponse(null);
      const { chatId, chatMessageId, error } = await sendMessage(
        {
          message,
          chatId: currentChatId!,
        },
        readHandler
      );
      if (error) {
        setAlert(`Something went wrong: ${error.message}`);
        setIsLoading(false);
        return;
      }
      setCurrentChatId(chatId!);
      setMessages((messages) => [
        {
          id: chatMessageId!,
          text: message,
          sender: 'user',
        },
        ...messages,
      ]);
      setCurrentMessage(null);
      getChatMessageResult(chatMessageId!).then(({ messageResult, error }) => {
        if (error) {
          setAlert(`Something went wrong: ${error.message}`);
          return;
        }
        setMessages((messages) => [
          {
            id: messageResult.id,
            text: messageResult.text,
            sender: 'bot',
          },
          ...messages,
        ]);
        setCurrentResponse(null);
      });
    } else {
      inputRef?.current?.focus();
      setAlert('Please enter a message');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [inputRef.current]);

  useEffect(() => {
    if (endOfMessagesRef.current) {
      const observer = new IntersectionObserver(([entry]) =>
        setShowScrollToBottomButton(!entry.isIntersecting)
      );
      observer.observe(endOfMessagesRef.current);
      return () => {
        observer.disconnect();
      };
    }
  }, [endOfMessagesRef.current]);

  useEffect(() => {
    if (inputRef.current) {
      if (isLoading && inputRef.current) {
        inputRef.current.disabled = true;
      } else {
        inputRef.current.disabled = false;
      }
    }
  }, [isLoading, inputRef.current]);

  return (
    <div className="flex flex-1 flex-col h-full relative">
      <div
        role="alert"
        className={`absolute top-1 left-0 right-0 flex justify-center duration-200 ${
          alert ? 'scale-100' : 'scale-0'
        }`}
      >
        <div
          className={`w-1/2 rounded-lg bg-red-600 text-white text-center py-2 duration-200 ${
            alert ? 'scale-100' : 'scale-0'
          }`}
        >
          {alert}
        </div>
      </div>
      <div className="h-full w-full overflow-y-auto">
        <div className="flex flex-col-reverse flex-1 min-h-full place-content-end">
          <div ref={endOfMessagesRef} className="w-full h-16" />
          {currentResponse && <Message text={currentResponse} sender="bot" />}
          {currentMessage && <Message text={currentMessage} sender="user" />}
          {messages.map((message) => (
            <Message
              key={message.id}
              text={message.text}
              sender={message.sender}
            />
          ))}
        </div>
      </div>
      <button
        className={`${
          showScrollToBottomButton ? 'scale-100' : 'scale-0'
        } absolute bottom-16 right-5 rounded-full bg-white p-2 shadow-lg`}
        onClick={() => {
          endOfMessagesRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'end',
            inline: 'nearest',
          });
        }}
      >
        <IoIosArrowDown className="text-2xl" />
      </button>
      <div className="absolute bottom-4 left-5 right-5 border rounded-lg opacity-90 z-50 overflow-hidden bg-white">
        <form>
          <div className="flex w-full items-center mr-1">
            <IoIosArrowForward className="ml-2 text-2xl" />
            <TextAreaAutosize
              ref={inputRef}
              tabIndex={0}
              rows={1}
              placeholder="Type a message..."
              className="py-1 w-full overflow-hidden resize-none focus:outline-none bg-transparent"
            />
            <button type="submit" onClick={handleSubmit}>
              <AiOutlineSend className="text-2xl mr-1" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
