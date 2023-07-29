import { AskQuestionBar } from "@components/AskQuestionBar";
import { Logo } from "@components/branding";
import { validServerSession } from "@services/user";
import Link from "next/link";

export default async function HomePage() {
  const { isValid } = await validServerSession();

  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
      <div className="flex flex-col w-full space-y-4 place-items-center">
        <div className="flex justify-center w-3/4 place-items-center md:w-1/2">
          <Logo size={"6xl"} colorscheme={"dark"} className="lg:text-8xl" />
        </div>
        <div className="flex justify-center w-3/4 md:w-1/2">
          <h2 className="p-2 text-xl font-bold text-center text-slate-800 md:text-2xl lg:text-3xl">
            An all new way to discover Jesus Christ with the power of{" "}
            <span className="text-blue-300">Artificial Intelligence</span>
          </h2>
        </div>
        {!isValid ? (
          <div className="flex flex-col justify-center w-2/3 space-y-2 text-center place-items-center md:space-y-0 md:w-2/5 md:space-x-2 md:flex-row">
            <Link
              href={"/chat"}
              className="w-full py-3 text-white rounded-md bg-slate-700 hover:bg-slate-900 hover:shadow-lg"
            >
              See Chats
            </Link>
            <Link
              href={"/devotions"}
              className="w-full py-3 text-white rounded-md bg-slate-700 hover:bg-slate-900 hover:shadow-lg"
            >
              See Devotions
            </Link>
            <Link
              href={"/login"}
              className="w-full py-3 text-white rounded-md bg-slate-700 hover:bg-slate-900 hover:shadow-lg"
            >
              Login
            </Link>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center w-5/6 space-y-4 text-center md:w-2/5">
            <AskQuestionBar />
            <div className="flex flex-col items-center justify-center w-full space-y-2 md:space-x-2 md:space-y-0 md:flex-row md:w-1/2">
              <Link
                href={"/chat"}
                className="w-full py-3 text-white rounded-md grow-0 shrink-0 bg-slate-700 hover:bg-slate-900 hover:shadow-lg"
              >
                See Chats
              </Link>
              <Link
                href={"/devotions"}
                className="w-full py-3 text-white rounded-md grow-0 shrink-0 bg-slate-700 hover:bg-slate-900 hover:shadow-lg"
              >
                See Devotions
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
