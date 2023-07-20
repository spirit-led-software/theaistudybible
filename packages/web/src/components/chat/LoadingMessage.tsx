"use client";

import { DarkSolidLineSpinner } from "@components";
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
          <DarkSolidLineSpinner size={"md"} />
        </div>
      </div>
    </div>
  );
}
