"use client";

import { Button } from "@components/ui/button";
import { apiConfig } from "@configs/index";
import { Devotion, SourceDocument } from "@core/model";
import { DevotionImage } from "@core/model/devotion";
import { devotionReactions } from "@core/schema";
import { useSession } from "@hooks/session";
import useWindowDimensions from "@hooks/window";
import { getDevotionReactionCounts } from "@services/devotion";
import Moment from "moment";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AiOutlineWarning } from "react-icons/ai";
import { FaThumbsDown, FaThumbsUp } from "react-icons/fa";
import { Sidebar } from "./Sidebar";

export function Window({
  devos,
  activeDevo,
  sourceDocuments,
  images,
  reactionCounts,
}: {
  devos: Devotion[];
  activeDevo: Devotion;
  sourceDocuments: SourceDocument[];
  images: DevotionImage[];
  reactionCounts: Awaited<ReturnType<typeof getDevotionReactionCounts>>;
}) {
  const { session } = useSession();
  const windowDimensions = useWindowDimensions();
  const [isSidebarOpen, setIsSidebarOpen] = useState(
    windowDimensions.width! > 1024
  );
  const [alert, setAlert] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [likeCount, setLikeCount] = useState(reactionCounts.LIKE ?? 0);
  const [dislikeCount, setDislikeCount] = useState(reactionCounts.DISLIKE ?? 0);

  const handleReaction = async (
    reaction: (typeof devotionReactions.reaction.enumValues)[number]
  ) => {
    setIsLoading(true);
    try {
      if (reaction === "LIKE") {
        setLikeCount((prevCount) => prevCount + 1);
      } else if (reaction === "DISLIKE") {
        setDislikeCount((prevCount) => prevCount + 1);
      }

      const response = await fetch(
        `${apiConfig.url}/devotions/${activeDevo.id}/reactions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session}`,
          },
          body: JSON.stringify({
            reaction: reaction,
          }),
        }
      );
      if (!response.ok) {
        // Revert reaction count
        if (reaction === "LIKE") {
          setLikeCount((prevCount) => prevCount - 1);
        } else if (reaction === "DISLIKE") {
          setDislikeCount((prevCount) => prevCount - 1);
        }

        const { error } = await response.json();
        throw new Error(error);
      }
    } catch (error: any) {
      console.error(error);
      setAlert(error.message);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (alert) {
      setTimeout(() => {
        setAlert(null);
      }, 5000);
    }
  }, [alert]);

  return (
    <>
      <Sidebar
        activeDevoId={activeDevo.id}
        initDevos={devos}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />
      <div className="absolute flex flex-col h-full overflow-y-scroll lg:w-full lg:static">
        <div className="relative flex flex-col w-full px-5 pt-5 pb-20 space-y-5">
          <div className="fixed z-20 flex justify-between space-x-1 bottom-3 right-3">
            <Button
              disabled={isLoading}
              onClick={() => handleReaction("LIKE")}
              className="text-center rounded-full group bg-slate-300 hover:bg-slate-400 bg-opacity-90"
            >
              <span className="mr-2">{likeCount}</span>
              <FaThumbsUp className="text-white group-hover:text-green-400" />
            </Button>
            <Button
              disabled={isLoading}
              onClick={() => handleReaction("DISLIKE")}
              className="text-center rounded-full group bg-slate-300 hover:bg-slate-400 bg-opacity-90"
            >
              <span className="mr-2">{dislikeCount}</span>
              <FaThumbsDown className="text-white group-hover:text-red-400" />
            </Button>
          </div>
          <div
            role="alert"
            className={`absolute left-0 right-0 flex justify-center duration-300 ${
              alert ? "scale-100 top-1" : "scale-0 -top-20"
            }`}
          >
            <div className="w-2/3 py-2 overflow-hidden text-center text-white truncate bg-red-400 rounded-lg">
              {alert}
            </div>
          </div>
          <h1 className="mb-2 text-2xl font-bold text-center lg:text-left">
            {Moment(activeDevo.createdAt).format("MMMM Do YYYY")}
          </h1>
          {(!activeDevo.prayer ||
            !activeDevo.reflection ||
            images.length === 0) && (
            <div className="flex flex-col justify-center w-full place-items-center lg:place-items-start lg:justify-start">
              <div className="flex justify-center w-3/4 px-3 py-2 mx-auto text-white bg-red-300 place-items-center rounded-xl lg:mx-0 lg:w-fit">
                <span className="mr-3">
                  <AiOutlineWarning className="text-xl" />
                </span>
                This devotion uses an old format. Some of the content may be
                missing or incorrect. We apologize for this inconvenience.
              </div>
            </div>
          )}
          {activeDevo.bibleReading && (
            <div className="flex flex-col w-full mb-3 break-words whitespace-pre-wrap">
              <h2 className="mb-2 text-xl font-bold text-center lg:text-left">
                Reading
              </h2>
              <div className="flex flex-col w-full">
                {activeDevo.bibleReading}
              </div>
            </div>
          )}
          {activeDevo.summary && (
            <div className="flex flex-col w-full mb-3 break-words whitespace-pre-wrap">
              <h2 className="mb-2 text-xl font-bold text-center lg:text-left">
                Summary
              </h2>
              <div className="flex flex-col w-full">{activeDevo.summary}</div>
            </div>
          )}
          {activeDevo.reflection && (
            <div className="flex flex-col w-full mb-3 break-words whitespace-pre-wrap">
              <h2 className="mb-2 text-xl font-bold text-center lg:text-left">
                Reflection
              </h2>
              <div className="flex flex-col w-full">
                {activeDevo.reflection}
              </div>
            </div>
          )}
          {activeDevo.prayer && (
            <div className="flex flex-col w-full mb-3 break-words whitespace-pre-wrap">
              <h2 className="mb-2 text-xl font-bold text-center lg:text-left">
                Prayer
              </h2>
              <div className="flex flex-col w-full">{activeDevo.prayer}</div>
            </div>
          )}
          {images && images.length > 0 && (
            <div className="flex flex-col w-full">
              <h2 className="mb-2 text-xl font-bold text-center lg:text-left">
                Generated Image(s)
              </h2>
              {images[0].caption && (
                <p className="mb-2 text-sm text-center">{images[0].caption}</p>
              )}
              <div className="flex flex-col w-full text-center lg:flex-row lg:space-x-5">
                {images.map((image, index) => (
                  <div key={image.id} className="flex flex-col w-full">
                    <Image
                      src={image.url}
                      alt="devotion image"
                      width={512}
                      height={512}
                      className="mx-auto mb-2 rounded-lg shadow-md lg:float-right lg:ml-5"
                    />
                    <p className="text-xs text-center">
                      This image was generated by AI from the devotion text.
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {sourceDocuments.length > 0 && (
            <div className="flex flex-col w-full mt-5">
              <h2 className="mb-2 font-bold">Sources</h2>
              <ul className="flex flex-col space-y-2 text-xs list-decimal list-inside text-slate-400">
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
                        className="hover:text-slate-500 hover:underline"
                      >
                        {(sourceDoc.metadata as any).name}
                      </Link>
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
