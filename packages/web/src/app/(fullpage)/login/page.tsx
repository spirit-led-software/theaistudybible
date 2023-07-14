"use client";

import { DarkLogo } from "@components/branding";
import { useUser } from "@hooks/user";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { FaFacebookF } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useUser();
  const emailInputRef = useRef<HTMLInputElement>(null);

  const urlError = searchParams.get("error");
  const [alert, setAlert] = useState<string | null>(urlError);

  if (user) {
    router.replace(searchParams.get("redirect") ?? "/");
  }

  const handleLogin = async (id: string) => {
    try {
      if (id === "email") {
        if (!emailInputRef.current?.value) {
          throw new Error("Email input is empty");
        }
        signIn("email", {
          email: emailInputRef.current?.value ?? "",
        });
      } else if (id === "google") {
        signIn("google");
      } else if (id === "facebook") {
        signIn("facebook");
      } else {
        throw new Error(`Invalid login method: ${id}`);
      }
    } catch (error: any) {
      setAlert(error.message);
    }
  };

  useEffect(() => {
    if (alert) {
      setTimeout(() => {
        setAlert(null);
      }, 5000);
    }
  }, [alert]);

  return (
    <div className="relative flex flex-col w-full px-5 pt-6 pb-10 bg-white shadow-lg lg:w-1/3 lg:h-full lg:place-content-center lg:px-20 bg-opacity-80 md:w-1/2">
      {alert && (
        <div className="absolute left-0 right-0 flex top-4 lg:top-20">
          <div className="px-4 py-2 mx-auto text-white bg-red-500 border border-red-500 rounded-xl lg:text-xl lg:bg-transparent lg:text-red-500">
            {alert}
          </div>
        </div>
      )}
      <div className="flex flex-col">
        <div className="items-center px-3 py-2 mx-auto mb-5 text-center border rounded-full border-slate-400 lg:mb-10 lg:py-4 lg:px-6">
          <DarkLogo size="2xl" />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-center font-maven">
          Please Log In
        </h1>
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
          <div className="w-full pt-4 space-y-3">
            <input
              className="w-full h-8 px-2 rounded-md outline outline-slate-400"
              placeholder="Email"
              ref={emailInputRef}
            />
            <button
              className="w-full px-4 py-2 font-bold text-white rounded bg-slate-700 hover:shadow-xl"
              onClick={() => {
                handleLogin("email");
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
