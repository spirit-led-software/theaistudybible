import { useEffect } from 'react';
import { useState } from 'react';

export const useCanShare = () => {
  const [canShare, setCanShare] = useState(false);
  useEffect(() => {
    if (typeof navigator === 'undefined') return;
    setCanShare(!!navigator.share);
  }, []);
  return canShare;
};
