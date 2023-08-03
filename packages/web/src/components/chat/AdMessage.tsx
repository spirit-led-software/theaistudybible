"use client";

import { useEffect } from "react";

export function AdMessage() {
  useEffect(() => {
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.log(err);
    }
  }, []);

  return (
    <div
      aria-hidden={true}
      className="flex flex-row items-center w-full px-2 py-4 overflow-hidden bg-white border border-t-slate-300"
    >
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-7748872527931209"
        data-ad-slot="5292294169"
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
