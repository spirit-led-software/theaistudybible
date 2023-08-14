"use client";

import { apiConfig } from "@configs";
import { useClientSession } from "@hooks/session";
import { useEffect, useState } from "react";
import { SolidLineSpinner } from "..";

export function CreateDevoForm() {
  const session = useClientSession();
  const [alert, setAlert] = useState<{
    message: string;
    type: "error" | "success";
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch(`${apiConfig.url}/devotions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session}`,
        },
        body: JSON.stringify({}),
      });
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      setAlert({ message: "Devotion created.", type: "success" });
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
          <SolidLineSpinner size={"md"} colorscheme={"dark"} />
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
        <h1 className="text-xl font-bold">Create Devotion</h1>
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
