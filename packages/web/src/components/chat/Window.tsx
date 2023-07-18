"use client";

import { UpdateAiResponseData } from "@chatesv/core/database/model";
import { chats } from "@chatesv/core/database/schema";
import useWindowDimensions from "@hooks/window";
import { Message as ChatMessage, useChat } from "ai/react";
import { InferModel } from "drizzle-orm";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { AiOutlineSend } from "react-icons/ai";
import { IoIosArrowDown, IoIosArrowForward } from "react-icons/io";
import TextAreaAutosize from "react-textarea-autosize";
import { useChats } from "../../hooks";
import { Message } from "./Message";
import { Sidebar } from "./Sidebar";

export function Window({
  initChats,
  initChatId,
  initialMessages,
  initQuery,
}: {
  initChats?: InferModel<typeof chats>[];
  initChatId?: string;
  initialMessages?: ChatMessage[];
  initQuery?: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const windowDimensions = useWindowDimensions();
  const [isSidebarOpen, setIsSidebarOpen] = useState(
    windowDimensions.width! > 1024
  );
  const [showScrollToBottomButton, setShowScrollToBottomButton] =
    useState<boolean>(false);
  const [chatId, setChatId] = useState<string | null>(initChatId ?? null);
  const [, setLastUserMessageId] = useState<string | null>(null);
  const [lastAiResponseId, setLastAiResponseId] = useState<string | null>(null);
  const { mutate } = useChats();
  const [lastChatMessage, setLastChatMessage] = useState<ChatMessage | null>(
    null
  );
  const [alert, setAlert] = useState<string | null>(null);
  const {
    handleSubmit,
    input,
    handleInputChange,
    messages,
    isLoading,
    error,
    setMessages,
    reload,
  } = useChat({
    api: "/api/chat",
    initialMessages,
    sendExtraMessageFields: true,
    onResponse: (response) => {
      setChatId(response.headers.get("x-chat-id"));

      setLastUserMessageId(response.headers.get("x-user-message-id"));

      setLastAiResponseId(response.headers.get("x-ai-response-id"));
    },
    onFinish: (message: ChatMessage) => {
      setLastChatMessage(message);
    },
  });

  const handleSubmitCustom = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    if (inputRef.current?.value === "") {
      setAlert("Please enter a message");
    }
    handleSubmit(event, {
      options: {
        body: {
          chatId: chatId ?? undefined,
        },
      },
    });
  };

  useEffect(() => {
    if (initQuery) {
      setMessages([
        {
          id: "1",
          content: initQuery,
          role: "user",
        },
      ]);
      reload();
      router.replace("/chat", undefined, { shallow: true });
    }
  }, []);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [inputRef]);

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
  }, [endOfMessagesRef]);

  useEffect(() => {
    if (inputRef.current) {
      if (isLoading) {
        inputRef.current.disabled = true;
      } else {
        inputRef.current.disabled = false;
      }
    }
  }, [isLoading, inputRef]);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({
      behavior: "instant",
      block: "end",
      inline: "end",
    });
  }, [messages]);

  useEffect(() => {
    if (error) {
      setAlert(error.message);
    }
  }, [error]);

  useEffect(() => {
    if (alert) {
      setTimeout(() => {
        setAlert(null);
      }, 5000);
    }
  }, [alert]);

  useEffect(() => {
    if (!isLoading && lastChatMessage && lastAiResponseId) {
      fetch(`/api/ai-responses/${lastAiResponseId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          aiId: lastChatMessage.id,
        } satisfies UpdateAiResponseData),
      })
        .then((response) => {
          if (!response.ok) {
            setAlert("Something went wrong");
          }
        })
        .catch((error) => {
          setAlert(error.message);
        });
      mutate();
    }
  }, [isLoading, lastChatMessage]);

  return (
    <>
      <Sidebar
        initChats={initChats}
        activeChatId={initChatId}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />
      <div
        className={`relative flex flex-col h-full lg:visible lg:w-full ${
          isSidebarOpen ? "invisible w-0" : "visible w-full"
        }`}
      >
        <div
          role="alert"
          className={`absolute left-0 right-0 flex justify-center duration-300 ${
            alert ? "scale-100 top-1" : "scale-0 -top-20"
          }`}
        >
          <div className="w-1/3 py-2 text-center text-red-400 border border-red-400 rounded-lg">
            {alert}
          </div>
        </div>
        <div className="w-full h-full overflow-y-scroll">
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
        <div className="absolute z-40 overflow-hidden bg-white border rounded-lg bottom-4 left-5 right-5 opacity-90">
          <form onSubmit={handleSubmitCustom}>
            <div className="flex items-center w-full mr-1">
              <IoIosArrowForward className="ml-2 text-2xl" />
              <TextAreaAutosize
                ref={inputRef}
                maxRows={3}
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
    </>
  );
}
