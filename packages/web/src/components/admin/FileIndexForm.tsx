"use client";

import { useIndexOps } from "@hooks/index-ops";
import { useEffect, useRef, useState } from "react";
import { SolidLineSpinner } from "..";

export function FileIndexForm() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);
  const [alert, setAlert] = useState<{
    message: string;
    type: "error" | "success";
  } | null>(null);
  const { mutate } = useIndexOps();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    const file = fileInputRef.current?.files?.[0];
    const name = nameInputRef.current?.value;
    const url = urlInputRef.current?.value;
    try {
      if (!file || !name || !url) {
        throw new Error("Please fill out all fields");
      }
      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", name);
      formData.append("url", url);
      const response = await fetch("/api/index-ops/file", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      mutate();
      setAlert({ message: "File index started.", type: "success" });
    } catch (error: any) {
      setAlert({
        message: `Error: ${error.message}`,
        type: "error",
      });
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
    <form className="relative flex-col w-full" onSubmit={handleSubmit}>
      {isLoading && (
        <div className="absolute left-0 right-0 flex justify-center">
          <SolidLineSpinner size="md" colorscheme={"dark"} />
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
        <h1 className="text-xl font-bold">Index File</h1>
        <div className="flex flex-col space-y-1">
          <label htmlFor="file">File</label>
          <input
            ref={fileInputRef}
            id="file"
            name="file"
            type="file"
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>
        <div className="flex flex-col space-y-1">
          <label htmlFor="name">Name</label>
          <input
            ref={nameInputRef}
            id="name"
            name="name"
            type="text"
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>
        <div className="flex flex-col space-y-1">
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
          className="w-full p-2 text-white bg-blue-300 rounded-md"
        >
          Submit
        </button>
      </div>
    </form>
  );
}
