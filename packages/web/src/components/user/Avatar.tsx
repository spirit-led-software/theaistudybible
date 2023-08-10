"use client";

import { useUser } from "@hooks/user";
import { ComponentSize, squareDimensionClasses } from "@lib/sizing";
import Image from "next/image";

export function Avatar({
  size = "md",
  largeSize = "md",
  className,
}: {
  size?: ComponentSize;
  largeSize?: ComponentSize;
  className?: string;
}) {
  const { user } = useUser();

  const dimensions = squareDimensionClasses[size];
  const largeDimensions = squareDimensionClasses[largeSize];

  if (user?.image) {
    return (
      <div
        className={`overflow-hidden rounded-full ${dimensions} lg:${largeDimensions} ${
          className ?? ""
        }`}
      >
        <Image
          className="w-full h-full"
          src={user.image}
          width={192}
          height={192}
          alt="avatar"
        />
      </div>
    );
  }

  return (
    <div
      className={`relative rounded-full bg-gray-300 ${dimensions} lg:${largeDimensions} ${
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
