"use client";

import { Button } from "@components/ui/button";
import { useRouter } from "next/navigation";
import { useRef } from "react";

export function AskQuestionBar() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAskQuestion = async () => {
    try {
      const query = inputRef.current?.value;
      if (query) {
        router.push(`/chat?query=${query}`);
      } else {
        router.push("/chat");
      }
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  return (
    <div className="flex w-full space-x-0">
      <input
        ref={inputRef}
        type="text"
        className="w-full px-2 py-1 rounded-r-none focus:outline-none rounded-xl"
        placeholder="Ask a question"
      />
      <Button
        onClick={handleAskQuestion}
        variant={"outline"}
        className="font-bold rounded-l-none"
      >
        Go!
      </Button>
    </div>
  );
}
