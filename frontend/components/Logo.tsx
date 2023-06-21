import Link from "next/link";
import { TbCross } from "react-icons/tb";

export type LogoProps = {
  className?: string;
};

export default function Logo(props: LogoProps) {
  const { className = "" } = props;
  return (
    <Link href={"/"} className={`inline-flex ${className}`}>
      <span className="text-white">cha</span>
      <TbCross className="text-white -mx-1 mt-0.5" />
      <span className="text-blue-300">ESV</span>
    </Link>
  );
}
