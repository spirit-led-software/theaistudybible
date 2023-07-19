import { ComponentSize, textSizeClasses } from "@lib/sizing";

export function DarkLogo({
  size = "md",
  largeSize = "md",
}: {
  size?: ComponentSize;
  largeSize?: ComponentSize;
}) {
  const sizeClass = textSizeClasses[size];
  const largeSizeClass = textSizeClasses[largeSize];

  return (
    <div
      className={`inline-flex items-center font-catamaran ${sizeClass} lg:${largeSizeClass}`}
    >
      <span className="text-slate-800">revelations</span>
      <span className="text-blue-300">AI</span>
    </div>
  );
}
