import { useUser } from "@hooks/user";

export function Avatar({ size }: { size?: "sm" | "md" | "lg" | "xl" }) {
  const user = useUser();

  const dimensionClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
    xl: "h-16 w-16",
  }[size ?? "md"];

  if (user?.image) {
    return (
      <img
        className={`rounded-full ${dimensionClasses}`}
        src={user.image}
        alt="avatar"
      />
    );
  }
  return (
    <div className={`relative rounded-full bg-gray-300 ${dimensionClasses}`}>
      <div
        className={`absolute inset-0 flex items-center justify-center rounded-full text-white text-xl font-bold`}
      >
        {user?.name?.[0] ?? ""}
      </div>
    </div>
  );
}
