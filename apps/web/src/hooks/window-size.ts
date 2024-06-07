import { createEffect, createSignal } from 'solid-js';

export function useWindowSize() {
  const [windowSize, setWindowSize] = createSignal({
    width: typeof window !== 'undefined' ? window.innerWidth : (undefined as unknown as number),
    height: typeof window !== 'undefined' ? window.innerHeight : (undefined as unknown as number)
  });

  createEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
}
