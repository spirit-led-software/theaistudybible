"use client";

import { apiConfig } from "@configs/index";
import { useSession } from "@hooks/session";
import { Chat } from "@revelationsai/core/database/model";
import Moment from "moment";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { AiOutlineDelete } from "react-icons/ai";
import { BsArrowLeftShort, BsPlus } from "react-icons/bs";
import { KeyedMutator } from "swr";
import { SolidLineSpinner } from "..";

type SidebarProps = {
  activeChatId?: string;
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  chats: Chat[];
  mutate: KeyedMutator<Chat[]>;
  isLoading: boolean;
  limit: number;
  setLimit: Dispatch<SetStateAction<number>>;
};

export function Sidebar({
  activeChatId,
  isOpen,
  setIsOpen,
  chats,
  mutate,
  isLoading,
  limit,
  setLimit,
}: SidebarProps) {
  const router = useRouter();
  const { session } = useSession();
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const createChat = async () => {
    const response = await fetch(`${apiConfig.url}/chats`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session}`,
      },
      body: JSON.stringify({
        name: "New Chat",
      }),
    });
    const chat = await response.json();
    if (chats.length >= limit) {
      setLimit((prevLimit) => prevLimit + 1);
    }
    mutate([chat, ...chats]);
  };

  const deleteChat = (id: string) => {
    if (confirm("Are you sure you want to delete this chat?")) {
      fetch(`${apiConfig.url}/chats/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session}`,
        },
      });
      setTimeout(() => {
        mutate(chats!.filter((chat) => chat.id !== id));
        if (activeChatId === id) {
          router.push("/chat");
        }
      }, 1000);
    }
  };

  const handleGetMoreChats = () => {
    setLimit((prevLimit) => prevLimit + 5);
    mutate(chats);
  };

  useEffect(() => {
    if (chats.length === 0 && isLoading) {
      setIsLoadingInitial(true);
    } else {
      setIsLoadingInitial(false);
    }
  }, [chats, isLoading]);

  useEffect(() => {
    if (chats.length < limit && isLoading) {
      setIsLoadingMore(true);
    } else {
      setIsLoadingMore(false);
    }
  }, [chats, isLoading, limit]);

  return (
    <div
      className={`fixed h-full bg-slate-700 border-t-2 duration-300 z-30 lg:w-1/4 lg:relative ${
        isOpen ? "w-full" : "w-0"
      }`}
    >
      <div
        className={`absolute p-1 top-2 rounded-full border border-slate-400 shadow-lg bg-white cursor-pointer duration-300 z-40 lg:hidden ${
          !isOpen ? "rotate-180 -right-10 opacity-70" : "right-2"
        }`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <BsArrowLeftShort className="text-xl text-slate-700" />
      </div>
      <div
        className={`h-full w-full overflow-y-scroll py-4 px-3 text-white lg:px-6 lg:visible ${
          isOpen ? "visible" : "invisible"
        }`}
      >
        <h1 className="px-2 text-2xl">Chat History</h1>
        <div className="flex flex-col content-center">
          <div className="flex justify-center w-full">
            <button
              className="flex items-center justify-center w-full py-2 my-2 border rounded-lg hover:bg-slate-900"
              onClick={() => createChat()}
            >
              New chat
              <BsPlus className="text-xl" />
            </button>
          </div>
          {isLoadingInitial && (
            <div className="flex justify-center w-full">
              <div className="flex items-center justify-center py-5">
                <SolidLineSpinner size="lg" colorscheme={"light"} />
              </div>
            </div>
          )}
          {chats.map((chat) => (
            <div
              key={chat.id}
              className={`flex place-items-center p-2 rounded-lg mb-2 hover:bg-slate-900 ${
                activeChatId === chat.id ? "bg-slate-800" : ""
              }`}
            >
              <Link href={`/chat/${chat.id}`} className="flex flex-col w-5/6">
                <div className="text-white truncate">{chat.name}</div>
                <div className="text-sm text-gray-400 truncate">
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
          {isLoadingMore && (
            <div className="flex justify-center w-full">
              <div className="flex items-center justify-center py-5">
                <SolidLineSpinner size="md" colorscheme={"light"} />
              </div>
            </div>
          )}
          {chats.length >= limit && !isLoadingMore && (
            <button
              className="flex justify-center py-2 text-center border border-white rounded-lg hover:bg-slate-900"
              onClick={handleGetMoreChats}
            >
              View more
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
