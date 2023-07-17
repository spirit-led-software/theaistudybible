"use client";

import { useSession } from "@hooks/session";
import { useUser } from "@hooks/user";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AiOutlineMenu } from "react-icons/ai";
import { IoIosArrowDown } from "react-icons/io";
import { LightLogo } from "./branding";
import { Avatar } from "./user";

const navItems = [
  {
    label: "Home",
    href: "/",
  },
  {
    label: "About",
    href: "/about",
  },
  {
    label: "Chat",
    href: "/chat",
  },
  {
    label: "Devotions",
    href: "/devotions",
  },
];

export function NavBar() {
  const pathname = usePathname();
  const { user } = useUser();
  const { setSession } = useSession();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const isActive = (path: string) => {
    if (path === "/") return pathname === path;
    return pathname.startsWith(path);
  };

  const signOut = async () => {
    setSession(null);
  };

  return (
    <>
      <nav className="relative flex items-center justify-between h-16 px-4 py-4 bg-slate-700">
        <Link href="/">
          <LightLogo size="2xl" />
        </Link>
        <div className="lg:hidden">
          <button
            className={`flex items-center p-3 text-blue-600 duration-300 transform ${
              !isOpen ? "rotate-180" : ""
            }`}
            onClick={() => setIsOpen(!isOpen)}
          >
            {!isOpen ? (
              <AiOutlineMenu className="text-white" />
            ) : (
              <IoIosArrowDown className="text-white" />
            )}
          </button>
        </div>
        <ul className="absolute hidden transform -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2 lg:flex lg:mx-auto lg:items-center lg:w-auto lg:space-x-6">
          {navItems.map((navItem) => (
            <li key={navItem.href}>
              <Link
                className={`block px-6 py-2 text-sm font-bold transition duration-200 rounded-xl ${
                  isActive(navItem.href)
                    ? "bg-white text-slate-800 hover:bg-gray-100 hover:text-slate-900"
                    : "bg-transparent text-white hover:bg-gray-800 hover:text-white"
                }`}
                href={navItem.href}
              >
                {navItem.label}
              </Link>
            </li>
          ))}
        </ul>
        {!user ? (
          <Link
            className="hidden px-6 py-2 text-sm font-bold text-gray-900 transition duration-200 lg:inline-block lg:ml-auto lg:mr-3 bg-gray-50 hover:bg-gray-200 rounded-xl"
            href="/login"
          >
            Log In
          </Link>
        ) : (
          <div className="hidden space-x-2 lg:flex">
            <div className="inline-flex items-center justify-center space-x-1">
              <Avatar size="sm" />
              <span className="ml-2 text-sm font-semibold text-white">
                {user.name ?? user.email}
              </span>
            </div>
            <button
              className="hidden px-6 py-2 text-sm font-bold text-gray-900 transition duration-200 lg:inline-block lg:ml-auto lg:mr-3 bg-gray-50 hover:bg-gray-200 rounded-xl"
              onClick={() => signOut()}
            >
              Log Out
            </button>
          </div>
        )}
      </nav>
      <div className={`relative z-50 ${!isOpen ? "hidden" : ""}`}>
        <nav className="fixed bottom-0 left-0 flex flex-col w-full px-6 py-6 overflow-y-auto bg-white border-r md:w-1/2 top-16">
          <div>
            <ul>
              {navItems.map((navItem) => (
                <li key={navItem.href}>
                  <Link
                    className={`block px-4 py-3 mb-3 text-md font-semibold leading-none rounded-xl ${
                      isActive(navItem.href)
                        ? "text-slate-800 bg-slate-200"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                    href={navItem.href}
                  >
                    {navItem.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-auto">
            <div className="pt-6">
              {!user ? (
                <Link
                  className="block px-4 py-3 mb-3 text-xs font-semibold leading-none text-center bg-gray-50 hover:bg-gray-100 rounded-xl"
                  href="/login"
                >
                  Log in
                </Link>
              ) : (
                <div className="flex flex-col w-full space-y-2">
                  <div className="inline-flex items-center justify-center">
                    <Avatar size="sm" />
                    <span className="ml-2 text-sm font-semibold text-gray-800">
                      {user.name ?? user.email}
                    </span>
                  </div>
                  <button
                    className="block px-10 py-3 mb-3 text-xs font-semibold leading-none text-center bg-gray-50 hover:bg-gray-100 rounded-xl"
                    onClick={() => signOut()}
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>
            <p className="my-4 text-xs text-center text-gray-400">
              <span>Copyright © 2023</span>
            </p>
          </div>
        </nav>
      </div>
    </>
  );
}
