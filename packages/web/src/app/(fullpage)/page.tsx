import { LightLogo } from "@components/branding";
import { Button } from "@components/ui/button";
import { validServerSession } from "@services/user";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const { isValid } = await validServerSession();

  const askQuestion = async (data: FormData) => {
    "use server";
    try {
      const query = data.get("query") as string;
      if (query) {
        redirect(`/chat?query=${query}`);
      } else {
        redirect("/chat");
      }
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-gradient-to-b to-slate-600 from-slate-900">
      <div className="flex flex-col w-full space-y-4 place-items-center">
        <div className="flex justify-center w-3/4 place-items-center lg:w-1/2">
          <h1 className="text-5xl font-extrabold text-center text-white lg:text-7xl font-kanit">
            Welcome to{" "}
            <span className="inline-flex px-2 py-1 rounded-xl">
              <div className="flex flex-col items-center">
                <LightLogo size="5xl" largeSize="7xl" />
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
        {!isValid ? (
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
        ) : (
          <form
            className="flex flex-col w-2/3 text-center lg:w-2/5"
            action={askQuestion}
          >
            <div className="flex w-full space-x-1">
              <input
                id="query"
                type="text"
                name="query"
                className="w-full px-2 py-1 rounded-r-none focus:outline-none rounded-xl"
                placeholder="Ask a question"
              />
              <Button
                variant={"outline"}
                className="font-bold rounded-l-none font-kanit"
              >
                Go!
              </Button>
            </div>
            <div className="flex justify-center w-full space-x-5">
              <Button
                type="submit"
                className="w-40 px-4 py-2 mt-10 text-white bg-blue-300 rounded-md hover:bg-blue-400"
              >
                See Chats
              </Button>
              <Link
                href={"/devotions"}
                className="w-40 px-4 py-2 mt-10 text-white bg-blue-300 rounded-md hover:bg-blue-400"
              >
                See Devotions
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
