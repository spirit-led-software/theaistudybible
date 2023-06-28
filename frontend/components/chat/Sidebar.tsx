"use client";

import { useState } from "react";
import { BsArrowLeftShort } from "react-icons/bs";

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const user = null;
  return (
    <div
      className={`h-full max-h-full grow-0 bg-slate-700 border-t-2 relative duration-300 ${
        isOpen ? "w-52" : "w-6"
      }`}
    >
      <div
        className={`absolute p-1 -right-3.5 top-2 rounded-full border border-slate-700 bg-white cursor-pointer duration-300 z-50 ${
          !isOpen ? "rotate-180" : ""
        }`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <BsArrowLeftShort className="text-slate-700 text-xl" />
      </div>
      <div
        className={`pt-4 px-6 text-white duration-300 ${
          isOpen ? "scale-100" : "scale-0"
        }`}
      >
        <h1 className="text-2xl mb-4">History</h1>
        <div className="text-sm">
          {user ? (
            <div>History here</div>
          ) : (
            <div>Login to see your chat history</div>
          )}
        </div>
      </div>
    </div>
  );
}
