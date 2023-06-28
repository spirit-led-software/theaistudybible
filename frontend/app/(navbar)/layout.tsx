import { NavBar } from "@/components";

export default function NavBarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <NavBar />
      {children}
    </div>
  );
}
