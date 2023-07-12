"use client";

import { useChats } from "@hooks/chat";
import Moment from "moment";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AiOutlineDelete } from "react-icons/ai";
import { BsArrowLeftShort, BsPlus } from "react-icons/bs";
import { LightSolidLineSpinner } from "..";

export function Sidebar({
  activeChatId,
  isOpen,
  setIsOpen,
}: {
  activeChatId?: string;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}) {
  const router = useRouter();
  const { chats, mutate, isLoading, isValidating, error } = useChats();

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
    mutate([...chats!, chat]);
  };

  const deleteChat = (id: string) => {
    if (confirm("Are you sure you want to delete this chat?")) {
      fetch(`/api/chats/${id}`, {
        method: "DELETE",
      });
      setTimeout(() => {
        mutate(chats!.filter((chat) => chat.id !== id));
        if (activeChatId === id) {
          router.push("/chat");
        }
      }, 1000);
    }
  };

  if (error) {
    throw error;
  }

  return (
    <div
      className={`h-full bg-slate-700 border-t-2 relative duration-300 lg:w-1/3 ${
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
        className={`h-full w-full overflow-y-scroll pt-4 px-3 text-white lg:px-6 lg:visible ${
          isOpen ? "visible" : "invisible"
        }`}
      >
        <h1 className="px-2 text-2xl">Chat History</h1>
        <div className="flex flex-col content-center">
          <div className="flex justify-center w-full">
            <div
              className="flex items-center justify-center w-full py-2 my-2 border rounded-lg cursor-pointer hover:bg-slate-900"
              onClick={() => createChat()}
            >
              New chat
              <BsPlus className="text-xl" />
            </div>
          </div>
          {isLoading || isValidating ? (
            <div className="flex justify-center w-full mt-10 place-items-center">
              <LightSolidLineSpinner size="md" />
            </div>
          ) : (
            chats?.map((chat) => (
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
            ))
          )}
        </div>
      </div>
    </div>
  );
}
