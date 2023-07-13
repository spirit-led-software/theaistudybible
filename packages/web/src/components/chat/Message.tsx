"use client";

import { Avatar } from "@components/user";
import { TbCross } from "react-icons/tb";
import { ResponseSources } from "./ResponseSources";

export function Message({
  chatId,
  id,
  text,
  sender,
}: {
  chatId: string;
  id: string;
  text: string;
  sender: string;
}) {
  return (
    <div className="flex flex-row items-center w-full px-2 py-4 bg-white border border-t-slate-300">
      <div className="flex flex-col content-start">
        {sender === "user" ? (
          <Avatar size="md" className="border shadow-lg" />
        ) : (
          <div className="relative w-10 h-10 border rounded-full shadow-lg">
            <TbCross className="absolute text-xl top-[25%] left-[25%]" />
          </div>
        )}
      </div>
      <div className="flex flex-col pl-5 pr-3">
        <div className="break-words whitespace-pre-wrap">{text}</div>
        {sender !== "user" && (
          <ResponseSources aiResponseId={id} chatId={chatId} />
        )}
      </div>
    </div>
  );
}
