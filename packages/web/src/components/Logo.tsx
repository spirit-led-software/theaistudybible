import { TbCross } from "react-icons/tb";

type Props = {
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
};

export function Logo({ size = "md" }: Props) {
  let fontSizeClass: string;
  switch (size) {
    case "sm":
      fontSizeClass = "text-md";
      break;
    case "md":
      fontSizeClass = "text-lg";
      break;
    case "lg":
      fontSizeClass = "text-xl";
      break;
    case "xl":
      fontSizeClass = "text-2xl";
      break;
    case "2xl":
      fontSizeClass = "text-3xl";
      break;
    case "3xl":
      fontSizeClass = "text-4xl";
      break;
    default:
      fontSizeClass = "text-lg";
      break;
  }

  return (
    <div className={`inline-flex items-center ${fontSizeClass}`}>
      <span className="text-white">cha</span>
      <TbCross className="text-white -ml-1 -mr-[0.2rem] mt-[.2rem]" />
      <span className="text-blue-300">ESV</span>
    </div>
  );
}
