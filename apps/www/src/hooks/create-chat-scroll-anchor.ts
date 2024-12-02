import { type Accessor, createEffect, createMemo, createSignal, on, onCleanup } from 'solid-js';

export type CreateChatScrollAnchorInput = {
  isLoading: boolean;
};

export const createChatScrollAnchor = (input?: Accessor<CreateChatScrollAnchorInput>) => {
  const isLoading = createMemo(() => input?.().isLoading ?? false);

  const [scrollRef, setScrollRef] = createSignal<HTMLDivElement>();
  const [topOfLastMessageRef, setTopOfLastMessageRef] = createSignal<HTMLElement>();
  const [bottomRef, setBottomRef] = createSignal<HTMLDivElement>();
  const [isTopVisible, setIsTopVisible] = createSignal(true);
  const [isAtBottom, setIsAtBottom] = createSignal(true);

  const scrollToBottom = () => {
    const currentScrollRef = scrollRef();
    if (currentScrollRef) {
      currentScrollRef.scrollTo({
        top: currentScrollRef.scrollHeight,
        behavior: 'smooth',
      });
    }
  };

  createEffect(
    on([scrollRef, bottomRef], ([scrollRef, bottomRef]) => {
      if (scrollRef && bottomRef) {
        const observer = new IntersectionObserver(
          ([entry]) => setIsAtBottom(entry.isIntersecting),
          { root: scrollRef, threshold: 0.6 },
        );
        observer.observe(bottomRef);
        onCleanup(() => observer.disconnect());
      }
    }),
  );

  createEffect(
    on([scrollRef, topOfLastMessageRef], ([scrollRef, topOfLastMessageRef]) => {
      if (scrollRef && topOfLastMessageRef) {
        const observer = new IntersectionObserver(
          ([entry]) => setIsTopVisible(entry.isIntersecting),
          { root: scrollRef, threshold: 1 },
        );
        observer.observe(topOfLastMessageRef);
        onCleanup(() => observer.disconnect());
      }
    }),
  );

  createEffect(
    on([scrollRef, bottomRef], ([scrollRef, bottomRef]) => {
      if (scrollRef && bottomRef) {
        const observer = new MutationObserver(() => {
          if (isAtBottom() && (isTopVisible() || !isLoading())) {
            bottomRef.scrollIntoView({ behavior: 'instant', block: 'end' });
          }
        });
        observer.observe(scrollRef, {
          childList: true,
          subtree: true,
          characterData: true,
        });
        onCleanup(() => observer.disconnect());
      }
    }),
  );

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
