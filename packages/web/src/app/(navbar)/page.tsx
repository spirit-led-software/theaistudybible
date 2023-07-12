import { Logo } from "@components";

export default function HomePage() {
  return (
    <div className="flex flex-1 px-3 py-2">
      <h1 className="w-full text-2xl font-bold text-center">
        Welcome to <Logo size="xl" />!
      </h1>
    </div>
  );
}
