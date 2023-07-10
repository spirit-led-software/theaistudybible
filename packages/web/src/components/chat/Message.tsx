"use client";

import { SourceDocument } from "@prisma/client";
import { useState } from "react";
import { IoIosArrowForward } from "react-icons/io";
import { TbCross } from "react-icons/tb";
import { SolidLineSpinner } from "..";

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
  const [showSources, setShowSources] = useState(false);
  const [sources, setSources] = useState<SourceDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  async function getSources() {
    if (sources.length > 0) return;
    try {
      setIsLoading(true);
      const response = await fetch(`/api/chats/${chatId}/messages/${id}`);
      const data = await response.json();
      const sourceDocuments: SourceDocument[] = data.sourceDocuments.map(
        ({ sourceDocument }: { sourceDocument: SourceDocument }) =>
          sourceDocument
      );
      setSources(
        sourceDocuments.filter((doc, index) => {
          const firstIndex = sourceDocuments.findIndex(
            (d) =>
              JSON.parse(d.metadata!.toLocaleString()).source ===
              JSON.parse(doc.metadata!.toLocaleString()).source
          );
          return firstIndex === index;
        })
      );
    } catch (error) {
      console.error(error);
    }
    setIsLoading(false);
  }

  return (
    <div className="flex flex-row items-center w-full px-2 py-4 bg-white border border-t-slate-300">
      <div className="p-2 border rounded-full shadow-lg">
        {sender === "user" ? (
          <div className="text-sm">You</div>
        ) : (
          <TbCross className="text-lg" />
        )}
      </div>
      <div className="flex flex-col pl-5 pr-3">
        <div className="break-words whitespace-pre-wrap">{text}</div>
        {sender !== "user" && (
          <div className="flex flex-col">
            <div
              className="flex flex-row items-center mt-2 space-x-1 cursor-pointer"
              onClick={() => {
                setShowSources(!showSources);
                getSources();
              }}
            >
              <div className="text-sm text-blue-400">Sources</div>
              <IoIosArrowForward
                className={`text-sm duration-300 ${
                  showSources ? "rotate-90" : "rotate-0"
                }`}
              />
            </div>
            {isLoading && <SolidLineSpinner size="sm" />}
            {sources && (
              <ul
                className={`flex flex-col space-y-1 duration-300 ${
                  showSources ? "" : "hidden"
                }`}
              >
                {sources.map((sourceDoc) => (
                  <li key={sourceDoc.id} className={`text-xs text-gray-400`}>
                    {JSON.parse(sourceDoc.metadata!.toLocaleString()).source}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
