import { type RefObject, useEffect, useRef } from 'react';

type SwipeHandlers = {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
};

export function useSwipe(elementRef: RefObject<HTMLElement | null>, handlers: SwipeHandlers) {
  const touchStartXRef = useRef(0);

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    function handleTouchStart(event: TouchEvent) {
      touchStartXRef.current = event.touches[0].clientX;
    }

    function handleTouchEnd(event: TouchEvent) {
      const touchEndX = event.changedTouches[0].clientX;
      const swipeDistance = touchEndX - touchStartXRef.current;

      if (Math.abs(swipeDistance) >= 100) {
        if (swipeDistance > 0 && handlers.onSwipeRight) {
          handlers.onSwipeRight();
        } else if (swipeDistance < 0 && handlers.onSwipeLeft) {
          handlers.onSwipeLeft();
        }
      }
    }

    el.addEventListener('touchstart', handleTouchStart);
    el.addEventListener('touchend', handleTouchEnd);

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchend', handleTouchEnd);
    };
  }, [elementRef, handlers]);
}
