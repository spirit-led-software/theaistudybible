import { TbCross } from "react-icons/tb";

type Props = {
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
};

export function Logo({ size = "md" }: Props) {
  const textSizeClass = {
    sm: "text-md",
    md: "text-lg",
    lg: "text-xl",
    xl: "text-2xl",
    "2xl": "text-3xl",
    "3xl": "text-4xl",
  }[size];

  return (
    <div className={`inline-flex items-center ${textSizeClass}`}>
      <span className="text-white">cha</span>
      <TbCross className="text-white -ml-1 -mr-[0.2rem] mt-[.2rem]" />
      <span className="text-blue-300">ESV</span>
    </div>
  );
}
