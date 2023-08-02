"use client";

import { useUser } from "@hooks/user";
import { ComponentSize, dimensionClasses } from "@lib/sizing";

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

  const dimensions = dimensionClasses[size];
  const largeDimensions = dimensionClasses[largeSize];

  if (user?.image) {
    return (
      <img
        className={`rounded-full ${dimensions} lg:${largeDimensions} ${
          className ?? ""
        }`}
        src={user.image}
        alt="avatar"
      />
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
