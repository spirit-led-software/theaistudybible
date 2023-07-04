import Link from 'next/link';
import { TbCross } from 'react-icons/tb';

type Props = {
  className?: string;
};

export function Logo({ className = '' }: Props) {
  return (
    <Link href={'/'} className={`inline-flex ${className}`}>
      <span className="text-white">cha</span>
      <TbCross className="text-white -ml-1 -mr-[0.2rem] mt-[.2rem]" />
      <span className="text-blue-300">ESV</span>
    </Link>
  );
}
