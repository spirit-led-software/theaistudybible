"use client";

import { useIndexOps } from "@hooks/index-ops";
import { uploadIndexFileToS3 } from "@lib/server-actions";
import { useEffect, useRef, useState, useTransition } from "react";
import { DarkSolidLineSpinner } from "..";

export function FileIndexForm() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);
  const [alert, setAlert] = useState<{
    message: string;
    type: "error" | "success";
  } | null>(null);
  const { mutate } = useIndexOps();
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    const name = nameInputRef.current?.value;
    const url = urlInputRef.current?.value;

    if (!file || !name || !url) {
      setAlert({ message: "Please fill out all fields.", type: "error" });
      return;
    }
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", name);
      formData.append("url", url);
      await uploadIndexFileToS3(formData);
      setAlert({ message: "File index started.", type: "success" });
    } catch (error: any) {
      setAlert({
        message: `Error: ${error.message}`,
        type: "error",
      });
    }
  };

  useEffect(() => {
    if (alert) {
      setTimeout(() => {
        setAlert(null);
      }, 5000);
    }
  }, [alert]);

  useEffect(() => {
    if (!isPending) {
      mutate();
    }
  }, [isPending, mutate]);

  return (
    <form
      className="relative flex-col w-full"
      onSubmit={(event) => startTransition(() => handleSubmit(event))}
    >
      {isPending && (
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
