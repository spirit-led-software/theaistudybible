import { ComponentSize, dimensionClasses } from "@lib/sizing";

export function DarkSolidLine({
  size,
  className,
}: {
  size: ComponentSize;
  className?: string;
}) {
  return (
    <div
      className={`border border-solid rounded-full border-slate-900 animate-spin border-t-transparent ${
        dimensionClasses[size]
      } ${className ?? ""}`}
    />
  );
}
