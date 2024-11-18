import { type Accessor, createEffect, onCleanup } from 'solid-js';

type SwipeHandlers = {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
};

export function useSwipe(element: Accessor<HTMLElement | undefined>, handlers: SwipeHandlers) {
  let touchStartX = 0;

  function handleTouchStart(event: TouchEvent) {
    touchStartX = event.touches[0].clientX;
  }

  function handleTouchEnd(event: TouchEvent) {
    const touchEndX = event.changedTouches[0].clientX;
    const swipeDistance = touchEndX - touchStartX;

    if (Math.abs(swipeDistance) >= 100) {
      if (swipeDistance > 0 && handlers.onSwipeRight) {
        handlers.onSwipeRight();
      } else if (swipeDistance < 0 && handlers.onSwipeLeft) {
        handlers.onSwipeLeft();
      }
    }
  }

  createEffect(() => {
    const el = element();
    if (el) {
      el.addEventListener('touchstart', handleTouchStart);
      el.addEventListener('touchend', handleTouchEnd);

      onCleanup(() => {
        el.removeEventListener('touchstart', handleTouchStart);
        el.removeEventListener('touchend', handleTouchEnd);
      });
    }
  });
}
