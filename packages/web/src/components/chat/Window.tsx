"use client";

import { apiConfig } from "@configs/index";
import { useSession } from "@hooks/session";
import useWindowDimensions from "@hooks/window";
import { Chat, UpdateAiResponseData } from "@revelationsai/core/database/model";
import { nanoid } from "ai";
import { Message as ChatMessage, useChat } from "ai/react";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { AiOutlineSend } from "react-icons/ai";
import { CgRedo } from "react-icons/cg";
import { IoIosArrowDown, IoIosArrowForward } from "react-icons/io";
import TextAreaAutosize from "react-textarea-autosize";
import { LoadingDots } from "..";
import { useChats } from "../../hooks";
import { Message } from "./Message";
import { Sidebar } from "./Sidebar";

export function Window({
  initChats,
  initChatId,
  initMessages,
}: {
  initChats?: Chat[];
  initChatId?: string;
  initMessages?: ChatMessage[];
}) {
  const searchParams = useSearchParams();
  const searchParamsQuery = searchParams.get("query");
  const { session } = useSession();

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const windowDimensions = useWindowDimensions();
  const [isSidebarOpen, setIsSidebarOpen] = useState(
    windowDimensions.width! > 1024
  );
  const [showScrollToBottomButton, setShowScrollToBottomButton] =
    useState<boolean>(false);
  const [chatId, setChatId] = useState<string | null>(initChatId ?? null);
  const [lastUserMessageId, setLastUserMessageId] = useState<string | null>(
    null
  );
  const [lastAiResponseId, setLastAiResponseId] = useState<string | null>(null);

  const {
    chats,
    mutate,
    isLoading: isChatsLoading,
    limit,
    setLimit,
  } = useChats(initChats, {
    limit: initChats?.length
      ? initChats.length < 7
        ? 7
        : initChats.length
      : 7,
  });
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
    api: apiConfig.chatUrl,
    initialMessages: initMessages,
    sendExtraMessageFields: true,
    onResponse: (response) => {
      if (response.status === 429) {
        setAlert("You have reached your daily query limit. Upgrade for more!");
        return;
      } else if (!response.ok) {
        setAlert("Something went wrong. Please try again.");
        return;
      }

      setChatId(response.headers.get("x-chat-id"));

      setLastUserMessageId(response.headers.get("x-user-message-id"));

      setLastAiResponseId(response.headers.get("x-ai-response-id"));
    },
    onFinish: (message: ChatMessage) => {
      setLastChatMessage(message);
    },
  });

  const handleSubmitCustom = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (inputRef.current?.value === "") {
        setAlert("Please enter a message");
      }
      handleSubmit(event, {
        options: {
          headers: {
            Authorization: `Bearer ${session}`,
          },
          body: {
            chatId: chatId ?? undefined,
          },
        },
      });
    },
    [chatId, handleSubmit]
  );

  const handleAiResponse = useCallback(
    async (chatMessage: ChatMessage, aiResponseId: string) => {
      try {
        const response = await fetch(
          `${apiConfig.url}/ai-responses/${aiResponseId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session}`,
            },
            body: JSON.stringify({
              aiId: chatMessage.id,
            } satisfies UpdateAiResponseData),
          }
        );
        if (!response.ok) {
          setAlert("Something went wrong");
        }
      } catch (err: any) {
        setAlert(`Something went wrong: ${err.message}`);
      } finally {
        mutate();
      }
    },
    [mutate]
  );

  const handleReload = useCallback(async () => {
    await reload({
      options: {
        headers: {
          Authorization: `Bearer ${session}`,
        },
        body: {
          chatId: chatId ?? undefined,
        },
      },
    });
    await mutate();
  }, [chatId, mutate, reload]);

  useEffect(() => {
    if (searchParamsQuery) {
      setMessages([
        ...messages,
        {
          id: nanoid(),
          content: searchParamsQuery,
          role: "user",
        },
      ]);
      handleReload();
    }
  }, [searchParamsQuery]);

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
    if (endOfMessagesRef.current) {
      endOfMessagesRef.current.scrollIntoView({
        behavior: "instant",
        block: "end",
        inline: "end",
      });
    }
  }, [messages]);

  useEffect(() => {
    if (error) {
      setAlert(`Something went wrong: ${error.message}`);
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
      handleAiResponse(lastChatMessage, lastAiResponseId);
    }
  }, [isLoading, lastChatMessage]);

  return (
    <>
      <Sidebar
        activeChatId={initChatId}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        chats={chats}
        mutate={mutate}
        isLoading={isChatsLoading}
        limit={limit}
        setLimit={setLimit}
      />
      <div
        className={`relative flex flex-col h-full lg:visible lg:w-full w-full z-0`}
      >
        <div
          role="alert"
          className={`absolute left-0 right-0 flex justify-center duration-300 ${
            alert ? "scale-100 top-1" : "scale-0 -top-20"
          }`}
        >
          <div className="w-2/3 py-2 overflow-hidden text-center text-white truncate bg-red-400 rounded-lg">
            {alert}
          </div>
        </div>
        {messages && messages.length > 0 ? (
          <div className="w-full h-full overflow-y-scroll">
            <div className="flex flex-col flex-1 min-h-full place-content-end">
              {messages.map((message, index) => (
                <div key={message.id} className="flex flex-col w-full">
                  {/* TODO: Add ads when adsense is approved
                  Randomly show an ad
                  {index !== 0 &&
                    index % Math.floor(Math.random() * 10) === 0 && (
                      <AdMessage />
                    )} */}
                  <Message
                    chatId={initChatId!}
                    message={message}
                    prevMessage={messages[index - 1]}
                  />
                </div>
              ))}
              <div ref={endOfMessagesRef} className="w-full h-16" />
            </div>
          </div>
        ) : (
          <div className="flex justify-center w-full h-full place-items-center justify-items-center">
            <div className="flex flex-col w-3/4 px-10 py-5 space-y-2 rounded-lg h-fit bg-slate-200 md:w-1/2">
              <h1 className="self-center text-xl font-bold md:text-2xl">
                Don{`'`}t know what to say?
              </h1>
              <h2 className="text-lg font-bold">Try asking:</h2>
              <ul className="space-y-1 list-disc list-inside">
                <li>Who is Jesus Christ?</li>
                <li>
                  How does Jesus dying on the cross mean that I can be saved?
                </li>
                <li>What is the Trinity?</li>
                <li>Can you find me a random Bible verse about grief?</li>
                <li>What does the Bible say about marriage?</li>
              </ul>
            </div>
          </div>
        )}
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
              {isLoading && (
                <div className="flex mr-1">
                  <LoadingDots size={"sm"} />
                </div>
              )}
              <button type="button" onClick={handleReload}>
                <CgRedo className="mr-1 text-2xl" />
              </button>
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
