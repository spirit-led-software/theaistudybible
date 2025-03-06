import { useLocation } from '@tanstack/react-router';
import { useState } from 'react';
import { useEffect } from 'react';

export const useIsChatPage = () => {
  const [isChatPage, setIsChatPage] = useState(false);
  const pathname = useLocation({
    select: (location) => location.pathname,
  });
  useEffect(() => {
    setIsChatPage(pathname.startsWith('/chat'));
  }, [pathname]);

  return isChatPage;
};
