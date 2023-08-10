"use client";

import { Adsense } from "@ctrl/react-adsense";

export function AdMessage() {
  return (
    <>
      {/* @ts-ignore */}
      {window.adsbygoogle && (
        <div
          aria-hidden={true}
          className="flex flex-row items-center w-full px-2 py-4 overflow-hidden bg-white border border-t-slate-300"
        >
          <Adsense
            client="ca-pub-7748872527931209"
            slot="5292294169"
            style={{
              display: "block",
            }}
            layout="in-article"
            format="fluid"
          />
        </div>
      )}
    </>
  );
}
