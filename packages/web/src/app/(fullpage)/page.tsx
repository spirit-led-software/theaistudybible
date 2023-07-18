import { LightLogo } from "@components/branding";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-gradient-to-b to-slate-600 from-slate-900">
      <div className="flex flex-col w-full space-y-4 place-items-center">
        <div className="flex justify-center w-3/4 place-items-center lg:w-1/2">
          <h1 className="text-5xl font-extrabold text-center text-white lg:text-7xl font-kanit">
            Welcome to{" "}
            <span className="inline-flex px-2 py-1 bg-transparent rounded-xl bg-opacity-20">
              <div className="flex flex-col items-center bg-transparent opacity-100">
                <LightLogo size="4xl" />
              </div>
            </span>
          </h1>
        </div>
        <div className="flex justify-center w-3/4 lg:w-1/2">
          <h2 className="p-2 text-xl font-bold text-center text-white lg:text-3xl">
            An all new way to discover Jesus using the power of{" "}
            <span className="text-blue-300">AI</span>
          </h2>
        </div>
        <div className="flex space-x-5">
          <Link
            href={"/login?redirect=/chat"}
            className="px-4 py-2 mt-10 text-white bg-blue-300 rounded-md hover:bg-blue-400"
          >
            Start Chatting
          </Link>
          <Link
            href={"/devotions"}
            className="px-4 py-2 mt-10 text-white bg-blue-300 rounded-md hover:bg-blue-400"
          >
            See Devotions
          </Link>
        </div>
      </div>
    </div>
  );
}
