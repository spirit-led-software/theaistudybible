"use client";

import { Devotion } from "@prisma/client";
import Moment from "moment";
import Link from "next/link";
import { useState } from "react";
import { BsArrowLeftShort } from "react-icons/bs";

export function Sidebar({
  activeDevoId,
  initDevos,
  isOpen,
  setIsOpen,
}: {
  activeDevoId: string;
  initDevos: Devotion[];
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}) {
  const [devos, setDevos] = useState(initDevos ?? []);

  return (
    <div
      className={`flex flex-col max-h-full bg-slate-700 border-t-2 relative duration-300 lg:w-1/3 ${
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
        className={`px-4 py-3 lg:px-6 lg:visible ${
          isOpen ? "visible" : "invisible"
        }`}
      >
        <h1 className="mb-4 text-2xl font-bold text-white">All Devotions</h1>
        <ul className="space-y-1 text-white">
          {devos.map((devo) => (
            <li
              key={devo.id}
              className={`px-2 py-1 rounded-md cursor-pointer duration-200 hover:bg-slate-900 ${
                devo.id === activeDevoId && "bg-slate-800"
              }`}
            >
              <Link
                href={`/devotions/${devo.id}`}
                className="flex flex-col truncate"
              >
                <div>{Moment(devo.createdAt).format("MMMM Do YYYY")}</div>
                <div className="text-xs">{devo.subject.split(" - ")[0]}</div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
