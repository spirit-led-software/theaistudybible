import { TbCross } from "react-icons/tb";

export function LightLogo({
  size = "md",
}: {
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl";
}) {
  const textSizeClass = {
    sm: "text-md",
    md: "text-lg",
    lg: "text-xl",
    xl: "text-2xl",
    "2xl": "text-3xl",
    "3xl": "text-4xl",
    "4xl": "text-5xl",
    "5xl": "text-6xl",
  }[size];

  const iconSizeClass = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
    xl: "text-3xl",
    "2xl": "text-4xl",
    "3xl": "text-5xl",
    "4xl": "text-6xl",
    "5xl": "text-7xl",
  }[size];

  return (
    <div className={`inline-flex items-center logo ${textSizeClass}`}>
      <span className="text-white underline">cha</span>
      <TbCross className={`-ml-2.5 -mr-2 text-white ${iconSizeClass}`} />
      <span className="text-blue-300 underline">ESV</span>
    </div>
  );
}
