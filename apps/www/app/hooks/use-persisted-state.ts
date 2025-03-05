import { useCallback } from 'react';
import { useState } from 'react';

export const usePersistedState = <T>(key: string, initialValue: T): [T, (value: T) => void] => {
  const [state, setState] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setPersistedState = useCallback(
    (value: T) => {
      setState(value);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(value));
      }
    },
    [key],
  );

  return [state, setPersistedState];
};
