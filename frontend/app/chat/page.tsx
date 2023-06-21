"use client";

import ChatMessage from "@/components/ChatMessage";
import { useEffect, useRef, useState } from "react";
import { AiOutlineSend } from "react-icons/ai";
import { IoIosArrowForward } from "react-icons/io";

type MessageData = {
  id: string;
  text: string;
  sender: string;
};

export default function ChatPage() {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [alert, setAlert] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [chatId, setChatId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentMessage, setCurrentMessage] = useState<string | null>(null);
  const [currentResponse, setCurrentResponse] = useState<string | null>(null);

  const getAnswerId = async (messageId: string) => {
    const response = await fetch(`/api/chat-messages/${messageId}/result`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });
    const data = await response.json();
    console.log("Answer data:", data);
    return data.id;
  };

  const handleSubmit = async (event: any) => {
    event.preventDefault();
    const message = inputRef.current?.value;
    if (message) {
      inputRef.current.value = "";
      setIsLoading(true);
      setAlert(null);
      setCurrentMessage(message);
      const result = await fetch("/api/chat-messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, chatId }),
      });
      setChatId(result.headers.get("X-Chat-ID"));
      setMessages((messages) => [
        {
          id: result.headers.get("X-Chat-Message-ID") as string,
          text: message,
          sender: "user",
        },
        ...messages,
      ]);
      setCurrentMessage(null);
      const reader = result.body?.getReader();
      if (reader) {
        const timeout = setTimeout(() => {
          reader.cancel();
          setIsLoading(false);
          setAlert("Request timed out");
        }, 20000);
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            const data = new TextDecoder()
              .decode(value)
              .replaceAll("data: ", "")
              .split(/\n\n/);
            for (const chunkData of data) {
              if (chunkData === "") continue;
              console.log("Chunk:", chunkData);
              const chunk = JSON.parse(chunkData);
              const text = chunk.text;
              console.log("Text:", text);
              setCurrentResponse((currentResponse) => {
                return currentResponse ? currentResponse + text : text;
              });
            }
          }
        }
        clearTimeout(timeout);
      }
    } else {
      inputRef.current!.focus();
      setAlert("Please enter a message");
    }
    setIsLoading(false);
  };

  useEffect(() => {
    inputRef.current!.focus();
  }, []);

  useEffect(() => {
    if (isLoading) {
      inputRef.current!.disabled = true;
    } else {
      inputRef.current!.disabled = false;
      if (currentResponse) {
        getAnswerId(messages[0].id).then((id) => {
          setMessages((messages) => [
            {
              id: id,
              text: currentResponse,
              sender: "bot",
            },
            ...messages,
          ]);
          setCurrentResponse(null);
        });
      }
    }
  }, [isLoading, currentResponse]);

  return (
    <div className="flex flex-1 flex-col-reverse relative overflow-y-auto">
      <div
        role="alert"
        className={`absolute top-1 left-0 right-0 flex justify-center duration-200 ${
          alert ? "scale-100" : "scale-0"
        }`}
      >
        <div
          className={`w-1/2 rounded-lg bg-red-600 text-white text-center py-2 duration-200 ${
            alert ? "scale-100" : "scale-0"
          }`}
        >
          {alert}
        </div>
      </div>
      <div className="h-20 bg-slate-800 w-full" />
      {currentMessage && <ChatMessage text={currentMessage} sender="user" />}
      {currentResponse && <ChatMessage text={currentResponse} sender="bot" />}
      {messages.map((message) => (
        <ChatMessage
          key={message.id}
          text={message.text}
          sender={message.sender}
        />
      ))}
      <div className="absolute flex flex-col bottom-5 left-5 right-5 border rounded-lg opacity-90 z-50 bg-white">
        <form className="flex flex-col w-full">
          <div className="inline-flex h-fit items-center w-full mr-1">
            <IoIosArrowForward className="ml-2 text-2xl" />
            <textarea
              tabIndex={0}
              rows={1}
              ref={inputRef}
              onChange={() => setAlert(null)}
              placeholder="Type a message"
              className="m-0 py-1 w-full resize-none focus:outline-none overflow-hidden bg-transparent"
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
