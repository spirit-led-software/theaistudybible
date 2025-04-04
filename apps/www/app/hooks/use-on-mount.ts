import { useEffect } from 'react';

export const useOnMount = (fn: () => void) => {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    fn();
  }, [fn]);
};
