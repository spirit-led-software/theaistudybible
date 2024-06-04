import { Show, type JSXElement } from 'solid-js';
import { useClerk } from '~/hooks/clerk';

export type ClerkLoadingProps = {
  children: JSXElement;
};

export default function ClerkLoading(props: ClerkLoadingProps) {
  const clerk = useClerk();
  const loaded = () => clerk().loaded;

  return <Show when={!loaded()}>{props.children}</Show>;
}
