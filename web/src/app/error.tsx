'use client';

import { useEffect } from 'react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col h-screen justify-items-center place-items-center">
      <div className="flex flex-col flex-1 place-content-center">
        <h2>Oops! Something went wrong!</h2>
        <button
          className="bg-slate-700 hover:bg-blue-300 hover:text-slate-700 text-white font-bold py-2 px-4 rounded"
          onClick={() => reset()}
        >
          Try again
        </button>
      </div>
    </div>
  );
}
