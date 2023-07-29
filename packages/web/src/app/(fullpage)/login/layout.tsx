import { Logo } from "@components/branding";
import { TbCross } from "react-icons/tb";

export default async function LoginPageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col flex-1 place-items-center place-content-center bg-slate-100 lg:place-items-end lg:place-content-end">
      <div className="fixed top-0 bottom-0 left-0 invisible right-96 lg:visible">
        <div className="flex flex-col items-center justify-center w-full h-full">
          <div className="flex flex-col w-full space-y-4 place-items-center">
            <div className="flex flex-col justify-center w-3/4 place-items-center">
              <TbCross className="text-6xl" />
              <Logo size={"6xl"} colorscheme={"dark"} className="lg:text-8xl" />
            </div>
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}
