import { createEffect, createSignal } from 'solid-js';

export const createScrollAnchor = () => {
  const [messagesRef, setMessagesRef] = createSignal<HTMLDivElement>();
  const [scrollRef, setScrollRef] = createSignal<HTMLDivElement>();
  const [visibilityRef, setVisibilityRef] = createSignal<HTMLDivElement>();

  const [isAtBottom, setIsAtBottom] = createSignal(true);
  const [isVisible, setIsVisible] = createSignal(false);
  const [shouldScrollToBottom, setShouldScrollToBottom] = createSignal(true);

  const scrollToBottomInstant = () => {
    const current = scrollRef();
    if (current) {
      current.scrollTop = current.scrollHeight;
    }
  };

  const scrollToBottomSmooth = () => {
    const current = scrollRef();
    if (current) {
      current.scrollTo({
        top: current.scrollHeight,
        behavior: 'smooth',
      });
    }
  };

  createEffect(() => {
    if (shouldScrollToBottom()) {
      scrollToBottomInstant();
    }
  });

  createEffect(() => {
    const current = scrollRef();

    if (current) {
      const handleScroll = () => {
        const { scrollTop, scrollHeight, clientHeight } = current;
        const offset = 10; // Small offset to account for minor discrepancies
        const bottomPosition = scrollTop + clientHeight;
        const newIsAtBottom = bottomPosition >= scrollHeight - offset;

        setIsAtBottom(newIsAtBottom);
        setShouldScrollToBottom(newIsAtBottom);
      };

      current.addEventListener('scroll', handleScroll, { passive: true });

      return () => {
        current.removeEventListener('scroll', handleScroll);
      };
    }
  });

  createEffect(() => {
    const observer = new MutationObserver(() => {
      if (isAtBottom()) {
        scrollToBottomInstant();
      }
    });

    const current = messagesRef();
    if (current) {
      observer.observe(current, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    }

    return () => observer.disconnect();
  }, [isAtBottom, scrollToBottomInstant]);

  createEffect(() => {
    const current = visibilityRef();
    if (current) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            setIsVisible(entry.isIntersecting);
          });
        },
        {
          rootMargin: '0px 0px -150px 0px',
        },
      );

      observer.observe(current);

      return () => {
        observer.disconnect();
      };
    }
  }, []);

  return {
    messagesRef,
    setMessagesRef,
    scrollRef,
    setScrollRef,
    visibilityRef,
    setVisibilityRef,
    scrollToBottomInstant,
    scrollToBottomSmooth,
    isAtBottom,
    isVisible,
  };
};
