import { useLocation } from '@tanstack/react-router';
import { useRef } from 'react';
import { useEffect } from 'react';

export const useBeforeLeave = (fn: () => void) => {
  const path = useLocation({ select: (s) => s.pathname });
  const prevPath = useRef(path);

  useEffect(() => {
    if (prevPath.current !== path) {
      fn();
    }
    prevPath.current = path;
  }, [path, fn]);
};
