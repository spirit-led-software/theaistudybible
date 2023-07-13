import { TbCross } from "react-icons/tb";

type Props = {
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
};

export function DarkLogo({ size = "md" }: Props) {
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
      <span className="underline text-slate-800">cha</span>
      <TbCross className={`-ml-2.5 -mr-2 text-slate-800 ${iconSizeClass}`} />
      <span className="text-blue-300 underline">ESV</span>
    </div>
  );
}
