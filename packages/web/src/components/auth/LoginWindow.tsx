"use client";

import { DarkLogo } from "@components/branding";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { FaFacebookF } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";

export function LoginWindow() {
  const searchParams = useSearchParams();
  const emailInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const urlError = searchParams.get("error");
  const [alert, setAlert] = useState<string | null>(urlError);
  const [checkEmailMessage, setCheckEmailMessage] = useState<string | null>(
    null
  );

  useEffect(() => {
    if (alert) {
      setTimeout(() => {
        setAlert(null);
      }, 5000);
    }
  }, [alert]);

  const handleLogin = async (id: string) => {
    const email = emailInputRef.current?.value;
    if (!email && id === "email") {
      setAlert("Please enter an email");
      return;
    }

    const { loginUrl } = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id,
        email,
        redirectPath: searchParams.get("redirect"),
      }),
    })
      .then((res) => res.json())
      .catch((err) => {
        console.error(err);
        setAlert(err.message);
      });

    if (loginUrl) {
      if (id === "email") {
        await fetch(loginUrl, {
          method: "GET",
        });
        setCheckEmailMessage(
          "Check your email for a link to login! Don't see it? Check your spam folder."
        );
        return;
      }
      router.push(loginUrl);
    } else {
      setAlert("Something went wrong");
    }
  };

  return (
    <div className="relative flex flex-col w-full px-5 pt-6 pb-10 bg-white shadow-lg lg:w-1/3 lg:h-full lg:place-content-center lg:px-20 bg-opacity-80 md:w-1/2">
      {alert && (
        <div className="absolute left-0 right-0 flex top-4 lg:top-20">
          <div className="px-4 py-2 mx-auto text-white bg-red-500 border border-red-500 rounded-xl lg:text-xl lg:bg-transparent lg:text-red-500">
            {alert}
          </div>
        </div>
      )}
      {checkEmailMessage && (
        <div className="absolute left-0 right-0 flex top-4 lg:top-20">
          <div className="px-4 py-2 mx-auto text-white bg-green-500 border border-green-500 rounded-xl lg:text-xl lg:bg-transparent lg:text-green-500">
            {checkEmailMessage}
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
          <div className="flex flex-col w-full pb-4 space-y-3 text-center">
            <button
              onClick={() => handleLogin("google")}
              className="w-full px-4 py-2 font-bold bg-white border rounded text-google hover:shadow-xl border-google"
            >
              <FcGoogle className="inline-block mr-2" />
              Login with Google
            </button>
            <button
              onClick={() => handleLogin("facebook")}
              className="w-full px-4 py-2 font-bold text-white rounded bg-facebook hover:shadow-xl"
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
              onClick={() => handleLogin("email")}
              className="w-full px-4 py-2 font-bold text-white rounded bg-slate-700 hover:shadow-xl"
            >
              Login with Email
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
