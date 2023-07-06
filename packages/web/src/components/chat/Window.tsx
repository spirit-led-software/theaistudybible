"use client";

import { Message as ChatMessage, useChat } from "ai/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AiOutlineSend } from "react-icons/ai";
import { IoIosArrowDown, IoIosArrowForward } from "react-icons/io";
import TextAreaAutosize from "react-textarea-autosize";
import { Message } from "./Message";

export function Window({
  chatId,
  initialMessages,
}: {
  chatId: string;
  initialMessages: ChatMessage[];
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const [showScrollToBottomButton, setShowScrollToBottomButton] =
    useState<boolean>(false);
  const {
    isLoading,
    handleSubmit,
    handleInputChange,
    input,
    messages,
    setMessages,
    error,
  } = useChat({
    api: "/api/chat",
    body: {
      chatId,
    },
    initialMessages,
    onFinish() {
      fetch(`/api/chats/${chatId}/messages`, {
        method: "GET",
      })
        .then(async (response) => {
          const data = await response.json();
          const retrievedMessages = data.entities;
          setMessages(
            retrievedMessages
              .map((message: any) => ({
                id: message.id,
                content: message.text,
                role: message.type !== "user" ? "assistant" : message.type,
              }))
              .reverse()
          );
        })
        .catch((error) => {
          console.error(error);
        });

      if (messages.length <= 3) {
        router.refresh();
      }
    },
  });

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
              chatId={chatId}
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
        <form onSubmit={handleSubmit}>
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
