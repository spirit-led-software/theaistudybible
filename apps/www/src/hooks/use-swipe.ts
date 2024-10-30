import { type Accessor, createEffect, onCleanup } from 'solid-js';

type SwipeHandlers = {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
};

export function useSwipe(element: Accessor<HTMLElement | undefined>, handlers: SwipeHandlers) {
  let touchStartX = 0;
  const minSwipeDistance = 50;

  function handleTouchStart(event: TouchEvent) {
    touchStartX = event.touches[0].clientX;
  }

  function handleTouchEnd(event: TouchEvent) {
    const touchEndX = event.changedTouches[0].clientX;
    const swipeDistance = touchEndX - touchStartX;

    if (Math.abs(swipeDistance) >= minSwipeDistance) {
      if (swipeDistance > 0 && handlers.onSwipeRight) {
        handlers.onSwipeRight();
      } else if (swipeDistance < 0 && handlers.onSwipeLeft) {
        handlers.onSwipeLeft();
      }
    }
  }

  let cleanup: (() => void) | undefined;

  function setupSwipe(el: HTMLElement) {
    el.addEventListener('touchstart', handleTouchStart);
    el.addEventListener('touchend', handleTouchEnd);

    cleanup = () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchend', handleTouchEnd);
    };
  }

  createEffect(() => {
    const el = element();
    if (el) {
      setupSwipe(el);
    }
  });

  onCleanup(() => {
    if (cleanup) {
      cleanup();
    }
  });
}
