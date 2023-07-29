"use client";

import { SolidLineSpinner } from "@components/loading";
import { Query } from "@revelationsai/core/database/helpers";
import { SourceDocument } from "@revelationsai/core/database/model";
import Link from "next/link";
import { useState } from "react";
import { IoIosArrowForward } from "react-icons/io";

export function ResponseSources({
  aiResponseId,
  chatId,
}: {
  aiResponseId: string;
  chatId: string;
}) {
  const [showSources, setShowSources] = useState(false);
  const [sources, setSources] = useState<SourceDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  async function getSources() {
    if (sources.length > 0) return;

    let query: Query = {
      AND: [],
    };

    if (aiResponseId) {
      query.AND!.push({
        eq: {
          column: "aiId",
          value: aiResponseId,
        },
      });
    }

    if (chatId) {
      query.AND!.push({
        eq: {
          column: "chatId",
          value: chatId,
        },
      });
    }

    try {
      setIsLoading(true);
      const fetchAiResponsesResponse = await fetch("/api/ai-responses/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
        } satisfies {
          query: Query;
        }),
      });
      const { entities: aiResponses } = await fetchAiResponsesResponse.json();
      const aiResponse = aiResponses[0];

      const fetchSourceDocsResponse = await fetch(
        `/api/ai-responses/${aiResponse.id}/source-documents`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      const foundSourceDocuments: SourceDocument[] =
        await fetchSourceDocsResponse.json();
      setSources(
        foundSourceDocuments.filter((sourceDoc, index) => {
          const firstIndex = foundSourceDocuments.findIndex(
            (otherSourceDoc) =>
              (sourceDoc.metadata as any).name ===
              (otherSourceDoc.metadata as any).name
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
      {isLoading && <SolidLineSpinner size="xs" colorscheme={"dark"} />}
      {sources && (
        <ul
          className={`flex flex-col space-y-1 duration-300 ${
            showSources ? "" : "hidden"
          }`}
        >
          {sources.map((sourceDoc) => (
            <li key={sourceDoc.id} className={`text-xs text-gray-400`}>
              <Link
                href={(sourceDoc.metadata as any).url ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                {(sourceDoc.metadata as any).name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
