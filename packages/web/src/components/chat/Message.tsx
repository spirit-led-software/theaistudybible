"use client";

import { Avatar } from "@components/user";
import { dimensionClasses } from "@lib/sizing";
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
    <div className="flex flex-row items-center w-full px-2 py-4 overflow-x-hidden bg-white border border-t-slate-300">
      <div className="flex flex-col content-start">
        {sender === "user" ? (
          <Avatar size="md" className="border shadow-lg" />
        ) : (
          <TbCross
            className={`${dimensionClasses["md"]} p-2 text-md text-center border rounded-full shadow-lg`}
          />
        )}
      </div>
      <div className="flex flex-col w-full pl-5 pr-3 overflow-x-clip">
        <div className="w-full break-words whitespace-pre-wrap">{text}</div>
        {sender !== "user" && (
          <ResponseSources aiResponseId={id} chatId={chatId} />
        )}
      </div>
    </div>
  );
}
