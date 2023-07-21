"use client";

import { BouncingDots } from "@components/loading/BouncingDots";
import { dimensionClasses } from "@lib/sizing";
import { TbCross } from "react-icons/tb";

export function LoadingMessage() {
  return (
    <div className="flex flex-row items-center w-full px-2 py-4 bg-white border border-t-slate-300">
      <div className="flex flex-col content-start">
        <TbCross
          className={`${dimensionClasses["md"]} p-2 text-md text-center border rounded-full shadow-lg`}
        />
      </div>
      <div className="flex flex-col pl-5 pr-3">
        <div className="justify-center w-full">
          <div className="px-2 py-3 rounded-xl bg-slate-200">
            <BouncingDots size="sm" className="bg-slate-800" />
          </div>
        </div>
      </div>
    </div>
  );
}
