"use client";

import useWindowDimensions from "@hooks/window";
import { Devotion, SourceDocument } from "@revelationsai/core/database/model";
import Moment from "moment";
import Link from "next/link";
import { useState } from "react";
import { Sidebar } from "./Sidebar";

export function Window({
  devos,
  activeDevo,
  sourceDocuments,
}: {
  devos: Devotion[];
  activeDevo: Devotion;
  sourceDocuments: SourceDocument[];
}) {
  const windowDimensions = useWindowDimensions();
  const [isSidebarOpen, setIsSidebarOpen] = useState(
    windowDimensions.width! > 1024
  );

  return (
    <>
      <Sidebar
        activeDevoId={activeDevo.id}
        initDevos={devos}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />
      <div
        className={`fixed flex flex-col h-full overflow-y-scroll lg:visible lg:w-full lg:relative`}
      >
        <div className="px-5 pt-5 pb-20 break-words whitespace-pre-wrap">
          <h1 className="mb-2 text-2xl font-bold text-center lg:text-left">
            {Moment(activeDevo.createdAt).format("MMMM Do YYYY")}
          </h1>
          <div className="">{activeDevo.content}</div>
          {sourceDocuments.length > 0 && (
            <>
              <h2 className="mt-5 mb-2 text-xl font-bold">Sources</h2>
              <ul className="flex flex-col space-y-2">
                {sourceDocuments
                  .filter((sourceDoc: SourceDocument, index: number) => {
                    const firstIndex = sourceDocuments.findIndex(
                      (otherSourceDoc: SourceDocument) =>
                        (sourceDoc.metadata as any).name ===
                        (otherSourceDoc.metadata as any).name
                    );
                    return firstIndex === index;
                  })
                  ?.map((sourceDoc: SourceDocument) => (
                    <li key={sourceDoc.id}>
                      <Link
                        href={(sourceDoc.metadata as any).url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-300 underline hover:text-blue-400"
                      >
                        {(sourceDoc.metadata as any).name}
                      </Link>
                    </li>
                  ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </>
  );
}
