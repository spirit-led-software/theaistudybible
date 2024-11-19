import { createEffect, createSignal, onCleanup } from 'solid-js';

export const createScrollAnchor = () => {
  const [scrollRef, setScrollRef] = createSignal<HTMLDivElement>();
  const [topOfLastMessageRef, setTopOfLastMessageRef] = createSignal<HTMLElement>();
  const [bottomRef, setBottomRef] = createSignal<HTMLDivElement>();
  const [isTopVisible, setIsTopVisible] = createSignal(true);
  const [isAtBottom, setIsAtBottom] = createSignal(true);

  const scrollToBottom = () => {
    const current = scrollRef();
    if (current) {
      current.scrollTo({
        top: current.scrollHeight,
        behavior: 'smooth',
      });
    }
  };

  createEffect(() => {
    const currentScroll = scrollRef();
    const currentBottom = bottomRef();

    if (currentScroll && currentBottom) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          setIsAtBottom(entry.isIntersecting);
        },
        { root: currentScroll, threshold: 0.6 },
      );

      observer.observe(currentBottom);

      onCleanup(() => {
        observer.disconnect();
      });
    }
  });

  createEffect(() => {
    const currentScroll = scrollRef();
    const currentTop = topOfLastMessageRef();

    if (currentScroll && currentTop) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          setIsTopVisible(entry.isIntersecting);
        },
        { root: currentScroll, threshold: 1 },
      );

      observer.observe(currentTop);

      onCleanup(() => {
        observer.disconnect();
      });
    }
  });

  createEffect(() => {
    const current = scrollRef();
    const visibilityCurrent = bottomRef();
    if (current && visibilityCurrent) {
      const observer = new MutationObserver(() => {
        if (isAtBottom() && isTopVisible()) {
          visibilityCurrent.scrollIntoView({ behavior: 'instant', block: 'end' });
        }
      });
      observer.observe(current, {
        childList: true,
        subtree: true,
        characterData: true,
      });
      onCleanup(() => observer.disconnect());
    }
  });

  return {
    scrollRef,
    setScrollRef,
    bottomRef,
    setBottomRef,
    topOfLastMessageRef,
    setTopOfLastMessageRef,
    scrollToBottom,
    isAtBottom,
  };
};
