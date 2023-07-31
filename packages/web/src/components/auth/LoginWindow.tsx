"use client";

import { Logo, SolidLineSpinner } from "@components";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { FaFacebookF, FaGoogle } from "react-icons/fa";

export function LoginWindow() {
  const searchParams = useSearchParams();
  const emailInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const urlError = searchParams.get("error");
  const [alert, setAlert] = useState<string | null>(urlError);
  const [checkEmailMessage, setCheckEmailMessage] = useState<string | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (alert) {
      setTimeout(() => {
        setAlert(null);
      }, 5000);
    }
  }, [alert]);

  useEffect(() => {
    if (checkEmailMessage) {
      setTimeout(() => {
        setCheckEmailMessage(null);
      }, 10000);
    }
  }, [checkEmailMessage]);

  const handleLogin = async (id: string) => {
    setIsLoading(true);

    try {
      const email = emailInputRef.current?.value;
      if (!email && id === "email") {
        throw new Error("Email is required");
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
        .then(async (res) => {
          if (!res.ok) {
            const errorMessage = (await res.text()) ?? "Something went wrong";
            throw new Error(errorMessage);
          }
          return await res.json();
        })
        .catch((err) => {
          console.error(err);
          throw new Error(err.message);
        });

      if (loginUrl) {
        if (id === "email") {
          await fetch(loginUrl, {
            method: "GET",
          });
          setCheckEmailMessage(
            "Check your email for a link to login! Don't see it? Check your spam folder."
          );
        } else {
          router.push(loginUrl);
        }
      } else {
        setAlert("Something went wrong");
      }
    } catch (error: any) {
      console.error(error);
      setAlert(error.message);
    }
    setIsLoading(false);
  };

  return (
    <div className="relative flex flex-col w-full px-5 pt-3 pb-10 bg-white shadow-xl lg:w-1/3 lg:h-full lg:place-content-center lg:px-20 md:w-1/2">
      {isLoading && (
        <div className="absolute left-0 right-0 flex justify-center -top-20 lg:top-32">
          <SolidLineSpinner size="xl" colorscheme={"dark"} />
        </div>
      )}
      {alert && (
        <div className="absolute left-0 right-0 flex -top-20 lg:top-20">
          <div className="px-4 py-2 mx-auto text-white bg-red-500 rounded-xl lg:text-xl">
            {alert}
          </div>
        </div>
      )}
      {checkEmailMessage && (
        <div className="absolute left-0 right-0 flex text-center -top-20 lg:top-20">
          <div className="px-4 py-2 mx-auto text-white bg-green-500 rounded-xl lg:text-xl">
            {checkEmailMessage}
          </div>
        </div>
      )}
      <div className="flex flex-col">
        <div className="items-center px-3 py-2 mx-auto my-8 text-center border rounded-lg border-slate-400 lg:mb-10 lg:py-4 lg:px-6">
          <Logo size="2xl" colorscheme={"dark"} />
        </div>
        <div className="divide-y divide-gray-600">
          <div className="flex flex-col w-full pb-4 space-y-3 text-center">
            <button
              onClick={() => handleLogin("google")}
              disabled={isLoading}
              className="w-full px-4 py-2 font-bold text-white rounded bg-slate-700 hover:shadow-xl hover:bg-slate-900"
            >
              <FaGoogle className="inline-block mr-2 text-white" />
              Login with Google
            </button>
            <button
              onClick={() => handleLogin("facebook")}
              disabled={isLoading}
              className="w-full px-4 py-2 font-bold text-white rounded bg-slate-700 hover:shadow-xl hover:bg-slate-900"
            >
              <FaFacebookF className="inline-block mr-2 text-white" />
              Login with Facebook
            </button>
          </div>
          <form
            className="w-full pt-4 space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              handleLogin("email");
            }}
          >
            <input
              type="email"
              className="w-full px-2 py-2 border shadow-xl outline-none focus:outline-none"
              placeholder="Email address"
              ref={emailInputRef}
            />
            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-4 py-2 font-bold text-white rounded bg-slate-700 hover:shadow-xl hover:bg-slate-900"
            >
              Login with Email
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
