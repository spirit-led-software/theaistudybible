import type { Devotion } from '@/schemas/devotions';
import { makePersisted } from '@solid-primitives/storage';
import type { JSX} from 'solid-js';
import { createContext, splitProps, useContext } from 'solid-js';
import type { SetStoreFunction, Store } from 'solid-js/store';
import { createStore } from 'solid-js/store';

export type DevotionStore = {
  devotion?: Devotion;
};

export type DevotionContextValue = [
  get: Store<DevotionStore>,
  set: SetStoreFunction<DevotionStore>,
];

export const DevotionContext = createContext<DevotionContextValue>();

export type DevotionProviderProps = {
  devotion?: Devotion;
  children: JSX.Element;
};

export const DevotionProvider = (props: DevotionProviderProps) => {
  const [local, others] = splitProps(props, ['children']);

  const [store, setStore] = makePersisted(
    createStore<DevotionStore>({
      devotion: others.devotion,
    }),
    {
      name: 'devotion',
    },
  );

  return (
    <DevotionContext.Provider value={[store, setStore] as DevotionContextValue}>
      {local.children}
    </DevotionContext.Provider>
  );
};

export const useDevotionStore = () => {
  const store = useContext(DevotionContext);
  if (!store) {
    throw new Error('useDevotionStore must be used within a DevotionProvider');
  }
  return store;
};
