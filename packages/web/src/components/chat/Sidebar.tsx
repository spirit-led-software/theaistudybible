"use client";

import { Chat } from "@types";
import Moment from "moment";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AiOutlineDelete } from "react-icons/ai";
import { BsArrowLeftShort, BsPlus } from "react-icons/bs";

export function Sidebar({
  activeChatId,
  initialChats,
}: {
  activeChatId: string;
  initialChats: Chat[];
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);
  const [chats, setChats] = useState<Chat[]>(initialChats);

  const createChat = async () => {
    const response = await fetch("/api/chats", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "New Chat",
      }),
    });
    const data = await response.json();
    const { chat } = data;
    setChats([chat, ...chats]);
    router.push(`/chat/${chat.id}`);
    router.refresh();
  };

  const deleteChat = (id: string) => {
    if (confirm("Are you sure you want to delete this chat?")) {
      fetch(`/api/chats/${id}`, {
        method: "DELETE",
      });
      setChats(chats.filter((chat) => chat.id !== id));
      router.push(`/chat`);
      router.refresh();
    }
  };

  return (
    <div
      className={`h-full max-h-full grow-0 bg-slate-700 border-t-2 relative duration-300 ${
        isOpen ? "w-52" : "w-0"
      }`}
    >
      <div
        className={`absolute p-1 top-2 rounded-full border border-slate-400 shadow-lg bg-white cursor-pointer duration-300 z-50 ${
          !isOpen ? "rotate-180 -right-10 opacity-70" : "-right-3.5"
        }`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <BsArrowLeftShort className="text-xl text-slate-700" />
      </div>
      <div
        className={`h-full w-full overflow-y-scroll pt-4 px-3 text-white duration-300 ${
          isOpen ? "scale-100" : "scale-0"
        }`}
      >
        <h1 className="text-2xl">History</h1>
        <div className="flex flex-col">
          <div
            className="flex justify-center py-2 my-2 border rounded-lg cursor-pointer hover:bg-slate-900"
            onClick={() => createChat()}
          >
            <BsPlus className="text-xl" />
          </div>
          {chats.map((chat) => (
            <div
              key={chat.id}
              className={`flex place-items-center p-2 rounded-lg mb-2 hover:bg-slate-900 ${
                activeChatId === chat.id ? "bg-slate-800" : ""
              }`}
            >
              <Link
                href={`/chat/${chat.id}`}
                className="flex flex-col w-5/6 overflow-x-clip"
              >
                <div className="text-white whitespace-nowrap overflow-ellipsis">
                  {chat.name}
                </div>
                <div className="text-sm text-gray-400">
                  {Moment(chat.createdAt).format("M/D/YYYY h:mma")}
                </div>
              </Link>
              <div className="flex justify-center flex-1">
                <AiOutlineDelete
                  className="text-lg cursor-pointer hover:text-red-500"
                  onClick={() => deleteChat(chat.id)}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
