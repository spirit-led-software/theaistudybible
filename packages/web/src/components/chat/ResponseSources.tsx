"use client";

import { SolidLineSpinner } from "@components/loading";
import { SourceDocument } from "@core/model";
import { aiResponses } from "@core/schema";
import { useClientSession } from "@hooks/session";
import { Query } from "@revelationsai/core/database/helpers";
import { getPropertyName } from "@revelationsai/core/util/object";
import {
  getAiResponseSourceDocuments,
  searchForAiResponses,
} from "@services/ai-response";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { IoIosArrowForward } from "react-icons/io";

export function ResponseSources({
  aiResponseId,
  chatId,
}: {
  aiResponseId: string;
  chatId: string;
}) {
  const session = useClientSession();
  const [showSources, setShowSources] = useState(false);
  const [sources, setSources] = useState<SourceDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasFetchedSources, setHasFetchedSources] = useState(false);

  const getSources = useCallback(async () => {
    if (hasFetchedSources) return;
    try {
      setIsLoading(true);
      let query: Query = {
        AND: [],
      };
      if (aiResponseId) {
        query.AND!.push({
          eq: {
            column: getPropertyName(
              aiResponses,
              (aiResponses) => aiResponses.aiId
            ),
            value: aiResponseId,
          },
        });
      }
      if (chatId) {
        query.AND!.push({
          eq: {
            column: getPropertyName(
              aiResponses,
              (aiResponses) => aiResponses.chatId
            ),
            value: chatId,
          },
        });
      }
      const { aiResponses: foundAiResponses } = await searchForAiResponses({
        query,
        token: session,
      });
      const aiResponse = foundAiResponses[0];

      const foundSourceDocuments = await getAiResponseSourceDocuments(
        aiResponse.id,
        {
          token: session,
        }
      );
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
      setHasFetchedSources(true);
    } catch (error) {
      console.error(error);
    }
    setIsLoading(false);
  }, [hasFetchedSources, aiResponseId, chatId]);

  useEffect(() => {
    if (showSources) {
      getSources();
    }
  }, [showSources, getSources]);

  return (
    <div className="flex flex-col w-full overflow-hidden grow-0">
      <div
        className="flex flex-row items-center w-full mt-2 space-x-1 cursor-pointer"
        onClick={() => {
          setShowSources(!showSources);
        }}
      >
        <div className="text-sm text-blue-400">Sources</div>
        <IoIosArrowForward
          className={`text-sm duration-300 ${
            showSources ? "rotate-90" : "rotate-0"
          }`}
        />
      </div>
      {isLoading && <SolidLineSpinner size="sm" colorscheme={"dark"} />}
      {sources && (
        <ul
          className={`flex flex-col w-full space-y-1 duration-300 ${
            showSources ? "" : "hidden"
          }`}
        >
          {sources.map((sourceDoc) => (
            <li key={sourceDoc.id} className={`text-xs text-gray-400 truncate`}>
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
