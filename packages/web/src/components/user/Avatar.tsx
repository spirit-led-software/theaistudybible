"use client";

import { useUser } from "@hooks/user";
import Image from "next/image";

export function Avatar({
  size,
  className,
}: {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const { user } = useUser();

  const dimensionClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
    xl: "h-16 w-16",
  }[size ?? "md"];

  if (user?.image) {
    return (
      <Image
        className={`rounded-full ${dimensionClasses}`}
        src={user.image}
        alt="avatar"
      />
    );
  }

  return (
    <div
      className={`relative rounded-full bg-gray-300 ${dimensionClasses} ${
        className ?? ""
      }`}
    >
      <div
        className={`absolute inset-0 flex items-center justify-center rounded-full text-white text-xl font-bold uppercase`}
      >
        {user?.name ? user.name[0] : user?.email ? user.email[0] : "?"}
      </div>
    </div>
  );
}
