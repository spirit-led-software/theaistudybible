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

  return (
    <div className={`inline-flex items-center ${textSizeClass}`}>
      <span className="text-slate-800">cha</span>
      <TbCross className="text-slate-800 -ml-1 -mr-[0.2rem] mt-[.2rem]" />
      <span className="text-blue-300">ESV</span>
    </div>
  );
}
