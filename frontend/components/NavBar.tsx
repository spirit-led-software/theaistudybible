"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "./Logo";

export default function NavBar() {
  const pathname = usePathname();
  return (
    <nav className="flex bg-slate-700 items-center h-12 relative">
      <Logo className="pl-3 text-2xl mr-2" />
      {[
        [1, "Chat", "/chat"],
        [2, "Devos", "/devos"],
      ].map(([index, label, href]) => {
        const isActive = pathname.startsWith(href as string);
        return (
          <Link
            key={index}
            href={href as string}
            className={`h-full px-4 py-2.5 transition duration-200 ${
              isActive
                ? "bg-white text-slate-700 cursor-default"
                : "text-blue-400 font-medium hover:bg-blue-400 hover:text-white"
            }`}
          >
            {label}
          </Link>
        );
      })}
      <div className="absolute py-2.5 text-white right-2">Login/Signup</div>
    </nav>
  );
}
