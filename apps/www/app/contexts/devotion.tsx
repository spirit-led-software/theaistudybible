import type { Devotion } from '@/schemas/devotions/types';
import { type ReactNode, createContext, useContext, useRef } from 'react';
import { useStore } from 'zustand';
import { type StoreApi, createStore } from 'zustand/vanilla';

export type DevotionState = {
  devotion: Devotion | null;
  setDevotion: (devotion: Devotion | null) => void;
};

export type DevotionActions = {
  setDevotion: (devotion: Devotion | null) => void;
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
    storeRef.current = createStore<DevotionStore>()((set) => ({
      devotion: devotion ?? null,
      setDevotion: (devotion) => set({ devotion }),
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
