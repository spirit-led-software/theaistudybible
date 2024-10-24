import { createEffect, createSignal } from 'solid-js';

export const createScrollAnchor = () => {
  const [messagesRef, setMessagesRef] = createSignal<HTMLDivElement>();
  const [scrollRef, setScrollRef] = createSignal<HTMLDivElement>();
  const [visibilityRef, setVisibilityRef] = createSignal<HTMLDivElement>();

  const [isAtBottom, setIsAtBottom] = createSignal(true);
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
    const visibilityCurrent = visibilityRef();

    if (current && visibilityCurrent) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          setIsAtBottom(entry.isIntersecting);
          setShouldScrollToBottom(entry.isIntersecting);
        },
        { root: current, threshold: 1 },
      );

      observer.observe(visibilityCurrent);

      return () => {
        observer.disconnect();
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
  });

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
  };
};
