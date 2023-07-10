"use client";

import { Message as ChatMessage, useChat } from "ai/react";
import { useEffect, useRef, useState } from "react";
import { AiOutlineSend } from "react-icons/ai";
import { IoIosArrowDown, IoIosArrowForward } from "react-icons/io";
import TextAreaAutosize from "react-textarea-autosize";
import { useChats } from "../../hooks";
import { Message } from "./Message";

export function Window({
  initChatId,
  initialMessages,
}: {
  initChatId?: string;
  initialMessages?: ChatMessage[];
}) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const [showScrollToBottomButton, setShowScrollToBottomButton] =
    useState<boolean>(false);
  const [chatId, setChatId] = useState<string | null>(initChatId ?? null);
  const { mutate } = useChats();

  const { isLoading, handleSubmit, handleInputChange, input, messages, error } =
    useChat({
      api: "/api/chat",
      initialMessages,
      sendExtraMessageFields: true,
      onFinish(message: ChatMessage) {
        mutate();
      },
    });

  const handleSubmitCustom = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    let submitChatId = chatId;
    if (!submitChatId) {
      const chat = await fetch("/api/chats", {
        method: "POST",
        body: JSON.stringify({
          name: "New Chat",
        }),
      })
        .then(async (response) => {
          const data = await response.json();
          return data.chat;
        })
        .catch((error) => {
          console.error(error);
        });
      submitChatId = chat.id;
      setChatId(chat.id);
      mutate();
    }
    handleSubmit(event, {
      options: {
        body: {
          chatId: submitChatId,
        },
      },
    });
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

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({
      behavior: "instant",
      block: "end",
      inline: "end",
    });
  }, [messages]);

  return (
    <div className="relative flex flex-col flex-1 h-full">
      <div
        role="alert"
        className={`absolute top-1 left-0 right-0 flex justify-center duration-200 ${
          error ? "scale-100" : "scale-0"
        }`}
      >
        <div
          className={`w-1/2 rounded-lg bg-red-600 text-white text-center py-2 duration-200 ${
            error ? "scale-100" : "scale-0"
          }`}
        >
          {error?.message}
        </div>
      </div>
      <div className="w-full h-full overflow-y-auto">
        <div className="flex flex-col flex-1 min-h-full place-content-end">
          {messages.map((message) => (
            <Message
              key={message.id}
              chatId={initChatId!}
              id={message.id}
              text={message.content}
              sender={message.role}
            />
          ))}
          <div ref={endOfMessagesRef} className="w-full h-16" />
        </div>
      </div>
      <button
        className={`${
          showScrollToBottomButton ? "scale-100" : "scale-0"
        } absolute bottom-16 right-5 rounded-full bg-white p-2 shadow-lg`}
        onClick={() => {
          endOfMessagesRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "end",
            inline: "nearest",
          });
        }}
      >
        <IoIosArrowDown className="text-2xl" />
      </button>
      <div className="absolute z-50 overflow-hidden bg-white border rounded-lg bottom-4 left-5 right-5 opacity-90">
        <form onSubmit={handleSubmitCustom}>
          <div className="flex items-center w-full mr-1">
            <IoIosArrowForward className="ml-2 text-2xl" />
            <TextAreaAutosize
              ref={inputRef}
              tabIndex={0}
              rows={1}
              placeholder="Type a message..."
              className="w-full py-1 overflow-hidden bg-transparent resize-none focus:outline-none"
              onChange={handleInputChange}
              value={input}
            />
            <button type="submit">
              <AiOutlineSend className="mr-1 text-2xl" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
