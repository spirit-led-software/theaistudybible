"use client";

import { useUser } from "@hooks/user";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import React from "react";
import { FaFacebookF } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useUser();
  const emailInputRef = React.useRef<HTMLInputElement>(null);

  if (user) {
    router.replace(searchParams.get("redirect") ?? "/");
  }

  return (
    <div className="w-2/3 px-4 py-4 bg-white rounded-md shadow-lg lg:w-1/5">
      <div className="flex flex-col">
        <h1 className="mb-2 text-2xl font-bold text-center">Please Log In</h1>
        <div className="divide-y divide-gray-600">
          <div className="w-full pb-4 space-y-3">
            <button
              className="w-full px-4 py-2 font-bold bg-white border rounded text-google hover:shadow-xl border-google"
              onClick={() => signIn("google")}
            >
              <FcGoogle className="inline-block mr-2" />
              Login with Google
            </button>
            <button
              className="w-full px-4 py-2 font-bold text-white rounded bg-facebook hover:shadow-xl"
              onClick={() => signIn("facebook")}
            >
              <FaFacebookF className="inline-block mr-2 text-white" />
              Login with Facebook
            </button>
          </div>
          <div className="container pt-4 space-y-3">
            <input
              className="w-full h-8 px-2 rounded-md outline outline-slate-400"
              placeholder="Email"
              ref={emailInputRef}
            />
            <button
              className="w-full px-4 py-2 font-bold text-white rounded bg-slate-700 hover:shadow-xl"
              onClick={() => {
                if (!emailInputRef.current?.value) return;
                signIn("email", {
                  email: emailInputRef.current?.value ?? "",
                });
              }}
            >
              Login with Email
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
