"use client";

import { apiConfig } from "@configs/index";
import { Chat } from "@core/model";
import { useSession } from "@hooks/session";
import Moment from "moment";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useState,
} from "react";
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

  const createChat = useCallback(async () => {
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
  }, [chats, limit, mutate, session, setLimit]);

  const deleteChat = useCallback(
    (id: string) => {
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
    },
    [activeChatId, chats, mutate, router, session]
  );

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
    if (chats.length <= limit && isLoading) {
      setIsLoadingMore(true);
    } else {
      setIsLoadingMore(false);
    }
  }, [chats, isLoading, limit]);

  return (
    <div
      className={`absolute flex h-full max-h-full bg-slate-700 border-t-2 duration-300 z-30 lg:w-1/4 lg:static ${
        isOpen ? "w-full" : "w-0"
      }`}
    >
      <div className="relative flex flex-col w-full h-full">
        <div
          className={`absolute top-2 p-1 z-40 rounded-full bg-white border border-slate-700 cursor-pointer duration-300 lg:hidden ${
            isOpen ? "rotate-0 right-2" : "rotate-180 -right-10 opacity-75"
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
          <h1 className="px-2 text-2xl font-bold">Chat History</h1>
          <div className="flex flex-col content-center w-full space-y-2">
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
                className={`flex place-items-center p-2 rounded-lg hover:bg-slate-900 ${
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
    </div>
  );
}
