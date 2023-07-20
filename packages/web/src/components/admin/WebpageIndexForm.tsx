"use client";

import { DarkSolidLineSpinner } from "@components";
import { apiConfig } from "@configs/index";
import { useIndexOps } from "@hooks/index-ops";
import { useSession } from "@hooks/session";
import { useEffect, useRef, useState } from "react";

export function WebpageIndexForm() {
  const nameInputRef = useRef<HTMLInputElement>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);
  const [alert, setAlert] = useState<{
    message: string;
    type: "error" | "success";
  } | null>(null);
  const { mutate } = useIndexOps();
  const { session } = useSession();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    const name = nameInputRef.current?.value;
    const url = urlInputRef.current?.value;
    try {
      if (!name || !url) {
        throw new Error("Name and URL are required.");
      }
      const response = await fetch(`${apiConfig.url}/scraper/webpage`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session}`,
        },
        body: JSON.stringify({ name, url }),
      });
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      setAlert({ message: "Webpage index completed.", type: "success" });
    } catch (error: any) {
      setAlert({
        message: `Error: ${error.message}`,
        type: "error",
      });
    }
    mutate();
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
    <form className="relative flex-col w-full" onSubmit={handleSubmit}>
      {isLoading && (
        <div className="absolute left-0 right-0 flex justify-center">
          <DarkSolidLineSpinner size="md" />
        </div>
      )}
      <div
        className={`absolute left-0 right-0 flex justify-center duration-300 ${
          alert ? "scale-100" : "scale-0"
        }`}
      >
        <div
          className={`px-5 mx-auto text-xl rounded-lg outline ${
            alert?.type === "error"
              ? "bg-red-300 outline-red-300"
              : "bg-green-300 outline-green-300"
          }`}
        >
          {alert?.message}
        </div>
      </div>
      <div className="flex flex-col space-y-2">
        <h1 className="text-xl font-bold">Index Webpage</h1>
        <div className="flex flex-col space-y-2">
          <label htmlFor="name">Name</label>
          <input
            ref={nameInputRef}
            id="name"
            name="name"
            type="text"
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>
        <div className="flex flex-col space-y-2">
          <label htmlFor="url">URL</label>
          <input
            ref={urlInputRef}
            id="url"
            name="url"
            type="text"
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>
      </div>
      <div className="mt-6">
        <button
          type="submit"
          className="w-full p-2 mt-4 text-white bg-blue-300 rounded-md"
        >
          Submit
        </button>
      </div>
    </form>
  );
}
