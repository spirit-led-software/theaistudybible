import type { Devotion } from '@/schemas/devotions/types';
import { type ReactNode, createContext, useContext, useRef } from 'react';
import { useStore } from 'zustand';
import { type StoreApi, createStore } from 'zustand/vanilla';

export type DevotionState = {
  devotion: Devotion | null;
};

export type DevotionActions = {
  setDevotion: React.Dispatch<React.SetStateAction<Devotion | null>>;
};

export type DevotionStore = DevotionState & DevotionActions;

export type DevotionContextValue = StoreApi<DevotionStore>;

export const DevotionContext = createContext<DevotionContextValue | null>(null);

export type DevotionProviderProps = {
  devotion?: Devotion;
  children: ReactNode;
};

export const DevotionProvider = ({ devotion, children }: DevotionProviderProps) => {
  const storeRef = useRef<DevotionContextValue>(null);
  if (!storeRef.current) {
    storeRef.current = createStore<DevotionStore>()((set, get) => ({
      devotion: devotion ?? null,
      setDevotion: (input) => {
        let devotion: Devotion | null;
        if (typeof input === 'function') {
          devotion = input(get().devotion);
        } else {
          devotion = input;
        }
        set({ devotion });
      },
    }));
  }

  return <DevotionContext.Provider value={storeRef.current}>{children}</DevotionContext.Provider>;
};

export const useDevotionStore = <T = DevotionStore>(selector?: (store: DevotionStore) => T): T => {
  const devotionStoreContext = useContext(DevotionContext);
  if (!devotionStoreContext) {
    throw new Error('useDevotionStore must be used within DevotionProvider');
  }

  if (!selector) {
    return useStore(devotionStoreContext, (state) => state) as T;
  }

  return useStore(devotionStoreContext, selector);
};
