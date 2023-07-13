"use client";

import useWindowDimensions from "@hooks/window";
import { Devotion, SourceDocument } from "@prisma/client";
import Moment from "moment";
import Link from "next/link";
import { useState } from "react";
import { Sidebar } from "./Sidebar";

export function Window({
  devos,
  activeDevoId,
}: {
  devos: Devotion[];
  activeDevoId: string;
}) {
  const windowDimensions = useWindowDimensions();
  const [isSidebarOpen, setIsSidebarOpen] = useState(
    windowDimensions.width! > 1024
  );
  const devo = devos.find((devo) => devo.id === activeDevoId);

  return (
    <>
      <Sidebar
        activeDevoId={activeDevoId}
        initDevos={devos}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />
      <div
        className={`flex flex-col h-full overflow-y-scroll lg:visible lg:w-full ${
          isSidebarOpen ? "invisible w-0" : "visible w-full"
        }`}
      >
        <div className="px-5 pt-5 pb-20 break-words whitespace-pre-wrap">
          <h1 className="mb-2 text-2xl font-bold">
            {Moment(devo!.createdAt).format("MMMM Do YYYY")}
          </h1>
          <div className="">{devo!.content}</div>
          {(devo as any).sourceDocuments &&
            (devo as any).sourceDocuments.length > 0 && (
              <>
                <h2 className="mt-5 mb-2 text-xl font-bold">Sources</h2>
                <ul className="flex flex-col space-y-2">
                  {(devo as any).sourceDocuments
                    .filter((sourceDoc: SourceDocument, index: number) => {
                      const firstIndex = (
                        devo as any
                      ).sourceDocuments.findIndex(
                        (otherSourceDoc: SourceDocument) =>
                          (sourceDoc.metadata as any).name ===
                          (otherSourceDoc.metadata as any).name
                      );
                      return firstIndex === index;
                    })
                    ?.map((sourceDoc: SourceDocument) => (
                      <li key={sourceDoc.id}>
                        <Link href={(sourceDoc.metadata as any).url}>
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
