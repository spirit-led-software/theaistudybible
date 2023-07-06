"use client";

import { Devo } from "@types";
import Moment from "moment";
import Link from "next/link";
import { useState } from "react";
import { BsArrowRightShort } from "react-icons/bs";

export function Sidebar({
  activeDevoId,
  devos,
}: {
  activeDevoId: string;
  devos: Devo[];
}) {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <div
      className={`h-full max-h-full grow-0 bg-slate-700 border-t-2 relative duration-300 ${
        isOpen ? "w-52" : "w-0"
      }`}
    >
      <div
        className={`absolute top-2 p-1 z-50 rounded-full bg-white border border-slate-700 cursor-pointer duration-300 ${
          isOpen ? "rotate-0 -right-3.5" : "rotate-180 -right-10 opacity-75"
        }`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <BsArrowRightShort className="text-xl" />
      </div>
      <ul
        className={`mt-2 mx-3 space-y-1 ${
          isOpen ? "scale-100" : "scale-0"
        } duration-300 text-white`}
      >
        {devos.map((devo) => (
          <li
            key={devo.id}
            className={`${
              devo.id === activeDevoId && "bg-slate-300 text-slate-700"
            } px-2 py-1 rounded-md cursor-pointer duration-200 hover:bg-slate-300 hover:text-slate-700`}
          >
            <Link href={`/devos/${devo.id}`} className="flex flex-col">
              <div>{Moment(devo.createdAt).format("MMMM Do YYYY")}</div>
              <div className="text-xs">{devo.subject.split(" - ")[0]}</div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
