'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Logo } from './Logo';

export function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  return (
    <nav className="sticky top-0 flex h-12 items-center bg-slate-700">
      <Logo className="pl-3 text-2xl mr-2" />
      {[
        [1, 'Chat', '/chat'],
        [2, 'Devos', '/devos'],
      ].map(([index, label, href]) => {
        const isActive = pathname.startsWith(href as string);
        return (
          <Link
            key={index}
            href={href as string}
            className={`h-full px-4 py-2.5 transition duration-200 ${
              isActive
                ? 'bg-white text-slate-700 cursor-default'
                : 'text-blue-400 font-medium hover:bg-blue-400 hover:text-white'
            }`}
          >
            {label}
          </Link>
        );
      })}
      <div className="absolute py-2.5 right-2">
        <button
          className="px-2 py-1 rounded-lg text-slate-700 bg-blue-300 hover:bg-slate-600 hover:text-slate-300"
          onClick={() => router.push('/login')}
        >
          Login
        </button>
      </div>
    </nav>
  );
}
