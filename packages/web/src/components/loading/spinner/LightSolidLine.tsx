export function LightSolidLine({
  size,
  className,
}: {
  size: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl";
  className?: string;
}) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
    xl: "h-16 w-16",
    "2xl": "h-20 w-20",
    "3xl": "h-24 w-24",
    "4xl": "h-28 w-28",
    "5xl": "h-32 w-32",
  }[size];

  return (
    <div
      className={`border border-solid rounded-full border-slate-200 animate-spin border-t-transparent ${sizeClasses} ${
        className ?? ""
      }`}
    />
  );
}
