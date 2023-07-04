import { Logo } from '@/components';

export default function HomePage() {
  return (
    <div className="flex flex-1 px-3 py-2">
      <h1 className="w-full text-2xl text-center font-bold">
        Welcome to{' '}
        <Logo className="inline-block bg-slate-700 rounded-lg px-2 py-1" />!
      </h1>
    </div>
  );
}
