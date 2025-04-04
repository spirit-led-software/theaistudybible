import { useEffect, useRef, useState } from 'react';

export const useChatScrollAnchor = ({ isLoading = false }: { isLoading: boolean }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const topOfLastMessageRef = useRef<HTMLElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const [isTopVisible, setIsTopVisible] = useState(true);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  };

  useEffect(() => {
    if (scrollRef.current && bottomRef.current) {
      const observer = new IntersectionObserver(([entry]) => setIsAtBottom(entry.isIntersecting), {
        root: scrollRef.current,
        threshold: 0.2,
      });
      observer.observe(bottomRef.current);
      return () => observer.disconnect();
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current && topOfLastMessageRef.current) {
      const observer = new IntersectionObserver(
        ([entry]) => setIsTopVisible(entry.isIntersecting),
        { root: scrollRef.current, threshold: 1 },
      );
      observer.observe(topOfLastMessageRef.current);
      return () => observer.disconnect();
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current && bottomRef.current) {
      const observer = new MutationObserver(() => {
        if (isAtBottom && isLoading && (!topOfLastMessageRef.current || isTopVisible)) {
          bottomRef.current?.scrollIntoView({ behavior: 'instant', block: 'end' });
        }
      });
      observer.observe(scrollRef.current, {
        childList: true,
        subtree: true,
        characterData: true,
      });
      return () => observer.disconnect();
    }
  }, [isLoading, isTopVisible, isAtBottom]);

  return {
    scrollRef,
    bottomRef,
    topOfLastMessageRef,
    scrollToBottom,
    isAtBottom,
  };
};
