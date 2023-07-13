import { DarkLogo } from "@components/branding";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-local bg-no-repeat bg-cover bg-homepage">
      <div className="flex flex-col w-full space-y-4 place-items-center">
        <div className="flex justify-center w-3/4 place-items-center lg:w-1/2">
          <h1 className="text-3xl font-bold text-center text-slate-800 lg:text-5xl">
            Welcome to{" "}
            <span className="inline-flex px-2 py-1 bg-white rounded-xl bg-opacity-40">
              <div className="flex flex-col items-center bg-transparent opacity-100">
                <DarkLogo size="3xl" />
              </div>
            </span>
          </h1>
        </div>
        <div className="flex justify-center w-3/4 lg:w-1/2">
          <h2 className="text-xl font-bold text-center text-white lg:text-3xl">
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
