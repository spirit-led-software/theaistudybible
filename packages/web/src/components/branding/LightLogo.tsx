import { ComponentSize, textSizeClasses } from "@lib/sizing";

export function LightLogo({
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
      className={`inline-flex items-center logo ${sizeClass} lg:${largeSizeClass}`}
    >
      <span className="text-white">revelations</span>
      <span className="text-blue-300">AI</span>
    </div>
  );
}
