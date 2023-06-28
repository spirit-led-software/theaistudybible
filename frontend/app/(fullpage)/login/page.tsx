"use client";

import { SolidLineSpinner } from "@/components";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useSessionContext } from "supertokens-auth-react/recipe/session";
import { emailPasswordSignIn } from "supertokens-auth-react/recipe/thirdpartyemailpassword";

export default function LoginPage() {
  const session = useSessionContext();
  const router = useRouter();
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const showPasswordRef = useRef<HTMLButtonElement>(null);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [invalidCredentials, setInvalidCredentials] = useState<boolean>(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleShowPassword = () => {
    if (passwordRef.current?.type === "password") {
      passwordRef.current.type = "text";
      setShowPassword(true);
    } else {
      passwordRef.current!.type = "password";
      setShowPassword(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      let response = await emailPasswordSignIn({
        formFields: [
          {
            id: "email",
            value: emailRef.current!.value,
          },
          {
            id: "password",
            value: passwordRef.current!.value,
          },
        ],
      });
      console.log(JSON.stringify(response));
      if (response.status === "FIELD_ERROR") {
        response.formFields.map((field) => {
          setFieldErrors((prev) => ({ ...prev, [field.id]: field.error }));
        });
      } else if (response.status === "WRONG_CREDENTIALS_ERROR") {
        setInvalidCredentials(true);
      } else {
        router.push("/");
      }
    } catch (error: any) {
      setLoginError(error.message);
    }
  };

  const clearErrors = () => {
    setFieldErrors({});
    setInvalidCredentials(false);
  };

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  if (session.loading) {
    return <SolidLineSpinner height={20} width={20} color="slate" />;
  }

  if (session.doesSessionExist) {
    router.push("/");
  }

  return (
    <div className="w-2/3 shadow-lg bg-white py-4 px-2">
      <h2 className="text-center text-xl">Login</h2>
      {loginError && (
        <div className="bg-red-400 text-white text-sm text-center px-2 py-1 rounded-lg">
          Oops! An error occurred signing in: {loginError}. Please try again
          later.
        </div>
      )}
      {invalidCredentials && (
        <div className="text-red-500 text-sm text-center">
          Invalid credentials
        </div>
      )}
      <form className="flex flex-col px-3 space-y-3" onSubmit={handleSubmit}>
        <label className="flex flex-col">
          <span className="text-sm">Email</span>
          <input
            ref={emailRef}
            className="border border-gray-300 rounded-md p-1 focus:outline-none"
            type="email"
            placeholder="Email"
            onChange={clearErrors}
          />
          {fieldErrors.email && (
            <div className="text-red-500 text-sm">{fieldErrors.email}</div>
          )}
        </label>
        <label className="flex flex-col">
          <span className="text-sm">Password</span>
          <div className="flex w-full rounded-md p-1 border border-gray-300">
            <input
              ref={passwordRef}
              className="w-full focus:outline-none"
              type="password"
              placeholder="Password"
              onChange={clearErrors}
            />
            <button
              ref={showPasswordRef}
              onClick={handleShowPassword}
              className="border-l pl-1 border-l-slate-300 text-xs"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          {fieldErrors.password && (
            <div className="text-red-500 text-sm">{fieldErrors.password}</div>
          )}
        </label>
        <button
          className="bg-blue-300 hover:bg-blue-400 text-white font-bold py-2 px-4 rounded"
          type="submit"
        >
          Login
        </button>
      </form>
      <div className="text-center mt-2">OR</div>
      <div className="flex flex-col p-3 space-y-3">
        <button className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
          Login with Google
        </button>
        <button className="bg-blue-600 hover:bg-blue-800 text-white font-bold py-2 px-4 rounded">
          Login with Facebook
        </button>
      </div>
      <div className="px-3">
        <p>
          Don't have an account?{" "}
          <Link
            href={"/signup"}
            className="text-blue-400 hover:text-blue-600 underline"
          >
            Signup
          </Link>
        </p>
      </div>
    </div>
  );
}
