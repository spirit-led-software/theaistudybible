"use client";

import { useDevotions } from "@hooks/devotion";
import { Devotion } from "@revelationsai/core/database/model";
import Moment from "moment";
import Link from "next/link";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { BsArrowLeftShort } from "react-icons/bs";
import { SolidLineSpinner } from "..";

export function Sidebar({
  activeDevoId,
  initDevos,
  isOpen,
  setIsOpen,
}: {
  activeDevoId: string;
  initDevos?: Devotion[];
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
}) {
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const { devos, isLoading, limit, setLimit, mutate } = useDevotions(
    initDevos,
    {
      limit: 7,
    }
  );

  const handleGetMoreDevos = () => {
    setLimit(limit + 5);
    mutate();
  };

  useEffect(() => {
    if (devos.length === 0 && isLoading) {
      setIsLoadingInitial(true);
    } else {
      setIsLoadingInitial(false);
    }
  }, [devos, isLoading]);

  useEffect(() => {
    if (devos.length <= limit && isLoading) {
      setIsLoadingMore(true);
    } else {
      setIsLoadingMore(false);
    }
  }, [devos, isLoading, limit]);

  return (
    <div
      className={`flex flex-col max-h-full bg-slate-700 border-t-2 relative duration-300 lg:w-1/4 z-30 ${
        isOpen ? "w-full" : "w-0"
      }`}
    >
      <div
        className={`absolute top-2 p-1 z-40 rounded-full bg-white border border-slate-700 cursor-pointer duration-300 lg:hidden ${
          isOpen ? "rotate-0 right-2" : "rotate-180 -right-10 opacity-75"
        }`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <BsArrowLeftShort className="text-xl" />
      </div>
      <div
        className={`h-full w-full overflow-y-scroll py-4 px-3 text-white lg:px-6 lg:visible ${
          isOpen ? "visible" : "invisible"
        }`}
      >
        <h1 className="px-2 mb-3 text-2xl font-bold">All Devotions</h1>
        <div className="flex flex-col content-center w-full space-y-2">
          {isLoadingInitial && (
            <div className="flex justify-center w-full">
              <div className="flex items-center justify-center py-5">
                <SolidLineSpinner size="lg" colorscheme={"light"} />
              </div>
            </div>
          )}
          {devos.map((devo) => (
            <div
              key={devo.id}
              className={`px-3 py-1 rounded-md cursor-pointer duration-200 hover:bg-slate-900 ${
                devo.id === activeDevoId && "bg-slate-800"
              }`}
            >
              <Link
                href={`/devotions/${devo.id}`}
                className="flex flex-col text-lg truncate"
              >
                <div>{Moment(devo.createdAt).format("MMMM Do YYYY")}</div>
                <div className="text-xs">
                  {devo.bibleReading.split(" - ")[0]}
                </div>
              </Link>
            </div>
          ))}
          {isLoadingMore && (
            <div className="flex justify-center w-full">
              <div className="flex items-center justify-center py-5">
                <SolidLineSpinner size="md" colorscheme={"light"} />
              </div>
            </div>
          )}
          {devos.length >= limit && !isLoadingMore && (
            <button
              className="flex justify-center py-2 text-center border border-white rounded-lg hover:bg-slate-900"
              onClick={handleGetMoreDevos}
            >
              View more
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
