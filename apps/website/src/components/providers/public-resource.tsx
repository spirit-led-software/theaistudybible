import { createContext, createMemo, type Accessor, type JSXElement } from 'solid-js';

export type PublicResources = {
  apiUrl: string;
};

export const PublicResourceContext = createContext<Accessor<PublicResources>>();

export type PublicEnvProviderProps = {
  children: JSXElement;
  resources: PublicResources;
};

export function PublicResourceProvider(props: PublicEnvProviderProps) {
  const resources = createMemo(() => props.resources);

  return (
    <PublicResourceContext.Provider value={resources}>
      {props.children}
    </PublicResourceContext.Provider>
  );
}
