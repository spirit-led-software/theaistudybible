import { useUser } from "@hooks/user";

export function Avatar({ size }: { size?: "sm" | "md" | "lg" | "xl" }) {
  const user = useUser();

  let sizeClasses: string;
  switch (size) {
    case "sm":
      sizeClasses = "h-8 w-8";
      break;
    case "md":
      sizeClasses = "h-10 w-10";
      break;
    case "lg":
      sizeClasses = "h-12 w-12";
      break;
    case "xl":
      sizeClasses = "h-16 w-16";
      break;
    default:
      sizeClasses = "h-10 w-10";
      break;
  }

  if (user?.image) {
    return (
      <img
        className={`w-10 h-10 rounded-full ${sizeClasses}`}
        src={user.image}
        alt="avatar"
      />
    );
  }
  return (
    <div className={`rounded-full bg-gray-300 ${sizeClasses}`}>
      {user?.name?.[0] ?? ""}
    </div>
  );
}
