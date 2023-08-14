"use client";

import { Button } from "@components/ui/button";
import { useRouter } from "next/navigation";
import { FormEvent, useRef } from "react";
import { AiOutlineArrowRight } from "react-icons/ai";

const potentialQuestions = [
  "Why does Jesus love me?",
  "What does John 3:16 say?",
  "How does Jesus offer salvation?",
  "Can you summarize the gospel?",
  "Explain the gospel to me.",
  "What is the gospel?",
  "What is the gospel of Jesus Christ?",
  "What is the gospel message?",
  "Who is the apostle Paul?",
  "When was Jesus born?",
  "Explain the trinity to me.",
  "What is the trinity?",
  "What does it mean to be a triune God?",
  "Can you find me bible verse about joy?",
];

export function AskQuestionBar() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAskQuestion = async (event: FormEvent) => {
    event.preventDefault();
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
    <form
      className="flex flex-col w-full space-y-1"
      onSubmit={handleAskQuestion}
    >
      <label className="text-sm text-gray-400">Ask a question</label>
      <div className="flex w-full space-x-0">
        <input
          ref={inputRef}
          type="text"
          className="w-full px-2 py-1 border rounded-lg rounded-r-none focus:outline-none focus:border-slate-800 border-slate-300"
          placeholder={
            potentialQuestions[
              Math.floor(Math.random() * potentialQuestions.length)
            ]
          }
        />
        <Button
          type="submit"
          variant={"outline"}
          className="font-bold rounded-l-none"
        >
          <AiOutlineArrowRight />
        </Button>
      </div>
    </form>
  );
}
