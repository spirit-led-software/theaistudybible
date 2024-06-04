import { JSX, createContext } from 'solid-js';
import type { Resource } from 'sst';

export type PublicResources = {
  chatApi: typeof Resource.ChatAPIFunction;
};

export const PublicResourceContext = createContext<PublicResources | null>(null);

export type PublicEnvProviderProps = {
  children: JSX.Element;
  resources: PublicResources;
};

export function PublicResourceProvider(props: PublicEnvProviderProps) {
  return (
    <PublicResourceContext.Provider value={props.resources}>
      {props.children}
    </PublicResourceContext.Provider>
  );
}
